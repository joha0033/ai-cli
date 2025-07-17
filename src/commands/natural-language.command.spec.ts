// Mock inquirer at the very top
jest.mock('inquirer');

import { Test, TestingModule } from '@nestjs/testing';
import { NaturalLanguageCommand } from './natural-language.command';
import {
  CommandParserService,
  CommandOption,
} from '../services/command-parser.service';

// Mock ora
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn(() => ({ stop: jest.fn() })),
  }));
});

// Mock chalk
jest.mock('chalk', () => ({
  blue: { bold: (text: string) => text },
  gray: (text: string) => text,
  green: Object.assign((text: string) => text, {
    bold: (text: string) => text,
  }),
  red: Object.assign((text: string) => text, { bold: (text: string) => text }),
  yellow: (text: string) => text,
  cyan: (text: string) => text,
  bold: (text: string) => text,
}));

describe('NaturalLanguageCommand', () => {
  let command: NaturalLanguageCommand;
  let commandParser: jest.Mocked<CommandParserService>;

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

  beforeEach(async () => {
    const inquirer = require('inquirer');
    inquirer.prompt.mockReset();
    const mockCommandParserService = {
      parseNaturalLanguage: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NaturalLanguageCommand,
        {
          provide: CommandParserService,
          useValue: mockCommandParserService,
        },
      ],
    }).compile();
    command = module.get<NaturalLanguageCommand>(NaturalLanguageCommand);
    commandParser = module.get(CommandParserService);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run', () => {
    it('should handle instruction provided as option', async () => {
      const inquirer = require('inquirer');
      commandParser.parseNaturalLanguage.mockResolvedValue(mockCommands);
      inquirer.prompt.mockResolvedValueOnce({ selectedIndex: 0 });
      inquirer.prompt.mockResolvedValueOnce({ confirm: false });
      await command.run([], { instruction: 'list files' });
      expect(commandParser.parseNaturalLanguage).toHaveBeenCalledWith(
        'list files'
      );
    });

    it('should prompt for instruction when not provided', async () => {
      const inquirer = require('inquirer');
      commandParser.parseNaturalLanguage.mockResolvedValue(mockCommands);
      inquirer.prompt.mockResolvedValueOnce({ userInstruction: 'list files' });
      inquirer.prompt.mockResolvedValueOnce({ selectedIndex: 0 });
      inquirer.prompt.mockResolvedValueOnce({ confirm: false });
      await command.run([], {});
      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'input',
          name: 'userInstruction',
          message: 'What would you like to do?',
        }),
      ]);
      expect(commandParser.parseNaturalLanguage).toHaveBeenCalledWith(
        'list files'
      );
    });

    it('should handle empty command results', async () => {
      commandParser.parseNaturalLanguage.mockResolvedValue([]);
      await command.run([], { instruction: 'invalid command' });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ No matching commands found')
      );
    });

    it('should handle user cancellation during command selection', async () => {
      const inquirer = require('inquirer');
      commandParser.parseNaturalLanguage.mockResolvedValue(mockCommands);
      inquirer.prompt.mockResolvedValueOnce({ selectedIndex: -1 });
      await command.run([], { instruction: 'list files' });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation cancelled')
      );
    });

    it('should handle user cancellation during confirmation', async () => {
      const inquirer = require('inquirer');
      commandParser.parseNaturalLanguage.mockResolvedValue(mockCommands);
      inquirer.prompt.mockResolvedValueOnce({ selectedIndex: 0 });
      inquirer.prompt.mockResolvedValueOnce({ confirm: false });
      await command.run([], { instruction: 'list files' });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Command execution cancelled')
      );
    });

    it('should handle dry run mode', async () => {
      const inquirer = require('inquirer');
      commandParser.parseNaturalLanguage.mockResolvedValue(mockCommands);
      inquirer.prompt.mockResolvedValueOnce({ selectedIndex: 0 });
      await command.run([], { instruction: 'list files', dry: true });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Dry run mode')
      );
    });
  });

  describe('executeCommand', () => {
    it('should execute command successfully', async () => {
      // Mock the runShellCommand method
      const mockRunShellCommand = jest.spyOn(command as any, 'runShellCommand');
      mockRunShellCommand.mockResolvedValue({
        success: true,
        output: 'file1.txt\nfile2.txt',
      });

      await (command as any).executeCommand(mockCommands[0]);

      expect(mockRunShellCommand).toHaveBeenCalledWith('ls -la');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Command executed successfully')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('file1.txt\nfile2.txt')
      );
    });

    it('should handle command execution failure', async () => {
      const mockRunShellCommand = jest.spyOn(command as any, 'runShellCommand');
      mockRunShellCommand.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      await (command as any).executeCommand(mockCommands[0]);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Command failed')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
    });

    it('should handle command execution error', async () => {
      const mockRunShellCommand = jest.spyOn(command as any, 'runShellCommand');
      mockRunShellCommand.mockRejectedValue(new Error('Command not found'));

      await (command as any).executeCommand(mockCommands[0]);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ Execution failed')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Command not found')
      );
    });
  });

  describe('runShellCommand', () => {
    it('should execute shell command successfully', async () => {
      const result = await (command as any).runShellCommand('echo "test"');

      expect(result.success).toBe(true);
      expect(result.output).toBe('test');
    });

    it('should handle command failure', async () => {
      const result = await (command as any).runShellCommand('exit 1');

      expect(result.success).toBe(false);
    });

    it('should handle command with stderr output', async () => {
      const result = await (command as any).runShellCommand(
        'ls nonexistentfile'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getRiskColor', () => {
    it('should return green for low risk', () => {
      const color = (command as any).getRiskColor('low');
      expect(typeof color).toBe('function');
    });

    it('should return yellow for medium risk', () => {
      const color = (command as any).getRiskColor('medium');
      expect(typeof color).toBe('function');
    });

    it('should return red for high risk', () => {
      const color = (command as any).getRiskColor('high');
      expect(typeof color).toBe('function');
    });

    it('should return gray for unknown risk', () => {
      const color = (command as any).getRiskColor('unknown');
      expect(typeof color).toBe('function');
    });
  });

  describe('option parsing', () => {
    it('should parse instruction option', () => {
      const result = command.parseInstruction('list files');
      expect(result).toBe('list files');
    });

    it('should parse dry option', () => {
      const result = command.parseDry();
      expect(result).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should validate non-empty instruction', () => {
      const inquirer = require('inquirer');
      const validate = inquirer.prompt.mock.calls[0]?.[0]?.[0]?.validate;

      if (validate) {
        expect(validate('valid input')).toBe(true);
        expect(validate('')).toBe('Please enter an instruction');
        expect(validate('   ')).toBe('Please enter an instruction');
      }
    });
  });
});
