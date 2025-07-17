import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { NaturalLanguageCommand } from './commands/natural-language.command';
import { CommandParserService } from './services/command-parser.service';
import { OpenAIService } from './services/openai.service';

jest.mock('inquirer', () => ({
  prompt: jest.fn(() =>
    Promise.resolve({
      userInstruction: 'list files',
      selectedIndex: 0,
      confirm: true,
    })
  ),
}));

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide NaturalLanguageCommand', () => {
    const command = module.get<NaturalLanguageCommand>(NaturalLanguageCommand);
    expect(command).toBeDefined();
    expect(command).toBeInstanceOf(NaturalLanguageCommand);
  });

  it('should provide CommandParserService', () => {
    const service = module.get<CommandParserService>(CommandParserService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(CommandParserService);
  });

  it('should provide OpenAIService', () => {
    const service = module.get<OpenAIService>(OpenAIService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(OpenAIService);
  });

  it('should inject dependencies correctly', () => {
    const command = module.get<NaturalLanguageCommand>(NaturalLanguageCommand);
    const commandParser =
      module.get<CommandParserService>(CommandParserService);

    // Verify that the command has the command parser injected
    expect((command as any).commandParser).toBeDefined();
    expect((command as any).commandParser).toBe(commandParser);
  });

  it('should inject OpenAIService into CommandParserService', () => {
    const commandParser =
      module.get<CommandParserService>(CommandParserService);
    const openaiService = module.get<OpenAIService>(OpenAIService);

    // Verify that the command parser has the OpenAI service injected
    expect((commandParser as any).openaiService).toBeDefined();
    expect((commandParser as any).openaiService).toBe(openaiService);
  });
});
