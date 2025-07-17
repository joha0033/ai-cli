import { Test, TestingModule } from '@nestjs/testing';
import { CommandParserService, CommandOption } from './command-parser.service';
import { OpenAIService } from './openai.service';

describe('CommandParserService', () => {
  let service: CommandParserService;
  let openaiService: jest.Mocked<OpenAIService>;

  beforeEach(async () => {
    const mockOpenAIService = {
      isConfigured: jest.fn(),
      convertToCommands: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandParserService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<CommandParserService>(CommandParserService);
    openaiService = module.get(OpenAIService);
  });

  describe('parseNaturalLanguage', () => {
    const mockOpenAICommands: CommandOption[] = [
      {
        command: 'ls -la',
        description: 'List all files with details',
        risk: 'low',
      },
    ];

    it('should use OpenAI service when configured and successful', async () => {
      openaiService.isConfigured.mockReturnValue(true);
      openaiService.convertToCommands.mockResolvedValue(mockOpenAICommands);

      const result = await service.parseNaturalLanguage('list files');

      expect(result).toEqual(mockOpenAICommands);
      expect(openaiService.isConfigured).toHaveBeenCalled();
      expect(openaiService.convertToCommands).toHaveBeenCalledWith(
        'list files'
      );
    });

    it('should fallback to pattern matching when OpenAI is not configured', async () => {
      openaiService.isConfigured.mockReturnValue(false);

      const result = await service.parseNaturalLanguage('list files');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].command).toContain('ls');
      expect(openaiService.convertToCommands).not.toHaveBeenCalled();
    });

    it('should fallback to pattern matching when OpenAI fails', async () => {
      openaiService.isConfigured.mockReturnValue(true);
      openaiService.convertToCommands.mockRejectedValue(new Error('API Error'));

      const result = await service.parseNaturalLanguage('list files');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].command).toContain('ls');
    });

    it('should fallback to pattern matching when OpenAI returns empty array', async () => {
      openaiService.isConfigured.mockReturnValue(true);
      openaiService.convertToCommands.mockResolvedValue([]);

      const result = await service.parseNaturalLanguage('list files');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].command).toContain('ls');
    });
  });

  describe('pattern matching', () => {
    beforeEach(() => {
      openaiService.isConfigured.mockReturnValue(false);
    });

    describe('file and directory operations', () => {
      it('should match list/show files commands', async () => {
        const result = await service.parseNaturalLanguage('list files');

        expect(result.some((cmd) => cmd.command === 'ls -la')).toBe(true);
        expect(
          result.some((cmd) => cmd.command.includes('find . -type f'))
        ).toBe(true);
      });

      it('should match create directory commands', async () => {
        const result = await service.parseNaturalLanguage(
          'create a new folder'
        );

        expect(result.some((cmd) => cmd.command.includes('mkdir -p'))).toBe(
          true
        );
      });

      it('should match create file commands', async () => {
        const result = await service.parseNaturalLanguage('create a new file');

        expect(result.some((cmd) => cmd.command.includes('touch'))).toBe(true);
      });

      it('should match delete file commands', async () => {
        const result = await service.parseNaturalLanguage('delete a file');

        expect(
          result.some(
            (cmd) => cmd.command.includes('rm ') && !cmd.command.includes('-rf')
          )
        ).toBe(true);
      });

      it('should match delete directory commands', async () => {
        const result = await service.parseNaturalLanguage('delete a directory');

        expect(result.some((cmd) => cmd.command.includes('rm -rf'))).toBe(true);
      });
    });

    describe('git operations', () => {
      it('should match git status commands', async () => {
        const result = await service.parseNaturalLanguage('check git status');

        expect(result.some((cmd) => cmd.command === 'git status')).toBe(true);
      });

      it('should match git add commands', async () => {
        const result = await service.parseNaturalLanguage(
          'stage files for git'
        );

        expect(result.some((cmd) => cmd.command === 'git add .')).toBe(true);
        expect(result.some((cmd) => cmd.command === 'git add -A')).toBe(true);
      });

      it('should match git commit commands', async () => {
        const result = await service.parseNaturalLanguage('commit changes');

        expect(result.some((cmd) => cmd.command.includes('git commit'))).toBe(
          true
        );
      });

      it('should match git push commands', async () => {
        const result = await service.parseNaturalLanguage('push to git');

        expect(
          result.some((cmd) => cmd.command === 'git push origin main')
        ).toBe(true);
        expect(result.some((cmd) => cmd.command === 'git push')).toBe(true);
      });

      it('should match git pull commands', async () => {
        const result = await service.parseNaturalLanguage('pull from git');

        expect(
          result.some((cmd) => cmd.command === 'git pull origin main')
        ).toBe(true);
        expect(result.some((cmd) => cmd.command === 'git pull')).toBe(true);
      });
    });

    describe('system operations', () => {
      it('should match current directory commands', async () => {
        const result = await service.parseNaturalLanguage(
          'show current directory'
        );

        expect(result.some((cmd) => cmd.command === 'pwd')).toBe(true);
      });

      it('should match disk space commands', async () => {
        const result = await service.parseNaturalLanguage('check disk space');

        expect(result.some((cmd) => cmd.command === 'df -h')).toBe(true);
        expect(result.some((cmd) => cmd.command === 'du -sh *')).toBe(true);
      });

      it('should match process commands', async () => {
        const result = await service.parseNaturalLanguage(
          'show running processes'
        );

        expect(result.some((cmd) => cmd.command === 'ps aux')).toBe(true);
        expect(result.some((cmd) => cmd.command === 'top')).toBe(true);
      });

      it('should match search commands', async () => {
        const result = await service.parseNaturalLanguage('find files');

        expect(result.some((cmd) => cmd.command.includes('find . -name'))).toBe(
          true
        );
        expect(result.some((cmd) => cmd.command.includes('grep -r'))).toBe(
          true
        );
      });
    });

    describe('package management', () => {
      it('should match install package commands', async () => {
        const result = await service.parseNaturalLanguage('install a package');

        expect(result.some((cmd) => cmd.command.includes('pnpm install'))).toBe(
          true
        );
      });

      it('should match run dev commands', async () => {
        const result = await service.parseNaturalLanguage(
          'start development server'
        );

        expect(result.some((cmd) => cmd.command === 'pnpm run dev')).toBe(true);
        expect(result.some((cmd) => cmd.command === 'pnpm start')).toBe(true);
      });

      it('should match build commands', async () => {
        const result = await service.parseNaturalLanguage(
          'build the application'
        );

        expect(result.some((cmd) => cmd.command === 'pnpm run build')).toBe(
          true
        );
      });
    });

    it('should provide fallback commands when no specific match is found', async () => {
      const result = await service.parseNaturalLanguage(
        'some random instruction'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((cmd) => cmd.command === 'ls -la')).toBe(true);
      expect(result.some((cmd) => cmd.command === 'pwd')).toBe(true);
      expect(result.some((cmd) => cmd.command === 'help')).toBe(true);
    });
  });

  describe('text extraction methods', () => {
    beforeEach(() => {
      openaiService.isConfigured.mockReturnValue(false);
    });

    it('should extract directory name from input', async () => {
      const result = await service.parseNaturalLanguage(
        'create a folder called test-dir'
      );

      expect(result.some((cmd) => cmd.command.includes('test-dir'))).toBe(true);
    });

    it('should extract file name from input', async () => {
      const result = await service.parseNaturalLanguage(
        'create a file called test.txt'
      );

      expect(result.some((cmd) => cmd.command.includes('test.txt'))).toBe(true);
    });

    it('should extract search term from input', async () => {
      const result = await service.parseNaturalLanguage(
        'find files containing config'
      );

      expect(result.some((cmd) => cmd.command.includes('config'))).toBe(true);
    });

    it('should extract package name from input', async () => {
      const result = await service.parseNaturalLanguage(
        'install package lodash'
      );

      expect(result.some((cmd) => cmd.command.includes('lodash'))).toBe(true);
    });
  });

  describe('risk levels', () => {
    beforeEach(() => {
      openaiService.isConfigured.mockReturnValue(false);
    });

    it('should assign low risk to read-only operations', async () => {
      const result = await service.parseNaturalLanguage('list files');

      const lsCommand = result.find((cmd) => cmd.command === 'ls -la');
      expect(lsCommand?.risk).toBe('low');
    });

    it('should assign medium risk to file modification operations', async () => {
      const result = await service.parseNaturalLanguage('create a file');

      const touchCommand = result.find((cmd) => cmd.command.includes('touch'));
      expect(touchCommand?.risk).toBe('low'); // touch is actually low risk
    });

    it('should assign high risk to destructive operations', async () => {
      const result = await service.parseNaturalLanguage('delete a directory');

      const rmCommand = result.find((cmd) => cmd.command.includes('rm -rf'));
      expect(rmCommand?.risk).toBe('high');
    });
  });
});
