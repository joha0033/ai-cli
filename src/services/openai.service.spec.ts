import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';
import { CommandOption } from './command-parser.service';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI),
}));

describe('OpenAIService', () => {
  let service: OpenAIService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.OPENAI_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAIService],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize OpenAI client when API key is provided', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      const newService = new OpenAIService();
      expect(newService.isConfigured()).toBe(true);
    });

    it('should not initialize OpenAI client when API key is not provided', () => {
      process.env.OPENAI_API_KEY = undefined;
      const newService = new OpenAIService();
      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('should return true when OpenAI client is initialized', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      const newService = new OpenAIService();
      expect(newService.isConfigured()).toBe(true);
    });

    it('should return false when OpenAI client is not initialized', () => {
      process.env.OPENAI_API_KEY = undefined;
      const newService = new OpenAIService();
      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('convertToCommands', () => {
    const mockCommands: CommandOption[] = [
      {
        command: 'ls -la',
        description: 'List all files and directories with details',
        risk: 'low',
      },
      {
        command: 'pwd',
        description: 'Show current directory path',
        risk: 'low',
      },
    ];

    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('should successfully convert instruction to commands', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockCommands),
            },
          },
        ],
      });

      const result = await service.convertToCommands('list files');

      expect(result).toEqual(mockCommands);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          {
            role: 'system',
            content: expect.stringContaining('You are a helpful assistant'),
          },
          { role: 'user', content: 'list files' },
        ]),
        max_tokens: 800,
        temperature: 0.3,
      });
    });

    it('should throw error when OpenAI is not configured', async () => {
      process.env.OPENAI_API_KEY = undefined;
      const newService = new OpenAIService();

      await expect(newService.convertToCommands('list files')).rejects.toThrow(
        'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      );
    });

    it('should throw error when OpenAI returns no content', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{}],
      });

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'No response from OpenAI'
      );
    });

    it('should throw error when OpenAI returns invalid JSON', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'Invalid JSON response from OpenAI'
      );
    });

    it('should throw error when OpenAI returns non-array response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ command: 'ls' }),
            },
          },
        ],
      });

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'Invalid response format from OpenAI'
      );
    });

    it('should throw error when command object is missing required fields', async () => {
      const invalidCommands = [
        {
          command: 'ls -la',
          // missing description and risk
        },
      ];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(invalidCommands),
            },
          },
        ],
      });

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'Invalid command structure from OpenAI'
      );
    });

    it('should default risk to medium when invalid risk level is provided', async () => {
      const commandsWithInvalidRisk = [
        {
          command: 'ls -la',
          description: 'List files',
          risk: 'invalid',
        },
      ];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(commandsWithInvalidRisk),
            },
          },
        ],
      });

      const result = await service.convertToCommands('list files');
      expect(result[0].risk).toBe('medium');
    });

    it('should handle OpenAI API quota exceeded error', async () => {
      const quotaError = new Error('insufficient_quota');
      (quotaError as any).code = 'insufficient_quota';
      mockOpenAI.chat.completions.create.mockRejectedValue(quotaError);

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'OpenAI API quota exceeded. Please check your billing.'
      );
    });

    it('should handle invalid API key error', async () => {
      const apiKeyError = new Error('invalid_api_key');
      (apiKeyError as any).code = 'invalid_api_key';
      mockOpenAI.chat.completions.create.mockRejectedValue(apiKeyError);

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.'
      );
    });

    it('should handle general OpenAI API errors', async () => {
      const generalError = new Error('Network error');
      mockOpenAI.chat.completions.create.mockRejectedValue(generalError);

      await expect(service.convertToCommands('list files')).rejects.toThrow(
        'OpenAI API error: Network error'
      );
    });
  });
});
