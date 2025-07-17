import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { CommandParserService, CommandOption } from '../services/command-parser.service';
import inquirer from 'inquirer';
import * as chalk from 'chalk';
import * as ora from 'ora';
import { spawn } from 'child_process';

interface NaturalLanguageCommandOptions {
  instruction?: string;
  dry?: boolean;
}

@Injectable()
@Command({
  name: 'nlcli',
  description: 'Convert natural language instructions to bash commands',
  options: { isDefault: true }
})
export class NaturalLanguageCommand extends CommandRunner {
  constructor(private readonly commandParser: CommandParserService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: NaturalLanguageCommandOptions,
  ): Promise<void> {
    console.log(chalk.blue.bold('🚀 Natural Language CLI'));
    console.log(chalk.gray('Convert your instructions into bash commands\n'));

    let instruction = options?.instruction;

    // If no instruction provided, ask for one
    if (!instruction) {
      const { userInstruction } = await inquirer.prompt([
        {
          type: 'input',
          name: 'userInstruction',
          message: 'What would you like to do?',
          validate: (input) => input.trim().length > 0 || 'Please enter an instruction',
        },
      ]);
      instruction = userInstruction;
    }

    // Parse the natural language instruction
    const spinner = ora('Parsing your instruction...').start();
    const commandOptions = this.commandParser.parseNaturalLanguage(instruction);
    spinner.stop();

    if (commandOptions.length === 0) {
      console.log(chalk.red('❌ No matching commands found for your instruction.'));
      return;
    }

    // Display options
    console.log(chalk.green.bold('\n📋 Available Commands:'));
    commandOptions.forEach((option, index) => {
      const riskColor = this.getRiskColor(option.risk);
      console.log(`\n${chalk.bold(`${index + 1}.`)} ${chalk.cyan(option.command)}`);
      console.log(`   ${chalk.gray(option.description)}`);
      console.log(`   ${riskColor(`Risk: ${option.risk.toUpperCase()}`)}`);
    });

    // Let user select a command
    const { selectedIndex } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedIndex',
        message: 'Select a command to run:',
        choices: [
          ...commandOptions.map((option, index) => ({
            name: `${option.command} - ${option.description}`,
            value: index,
          })),
          { name: chalk.gray('Cancel'), value: -1 },
        ],
      },
    ]);

    if (selectedIndex === -1) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }

    const selectedCommand = commandOptions[selectedIndex];

    // Show command details and ask for confirmation
    console.log(chalk.blue.bold('\n📝 Command Details:'));
    console.log(`Command: ${chalk.cyan(selectedCommand.command)}`);
    console.log(`Description: ${chalk.gray(selectedCommand.description)}`);
    console.log(`Risk Level: ${this.getRiskColor(selectedCommand.risk)(selectedCommand.risk.toUpperCase())}`);

    if (options?.dry) {
      console.log(chalk.yellow('\n🔍 Dry run mode - command will not be executed.'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Execute this command?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Command execution cancelled.'));
      return;
    }

    // Execute the command
    await this.executeCommand(selectedCommand);
  }

  private async executeCommand(commandOption: CommandOption): Promise<void> {
    console.log(chalk.blue.bold('\n⚡ Executing command...'));
    console.log(chalk.gray(`Running: ${commandOption.command}`));

    const spinner = ora('Executing...').start();

    try {
      const result = await this.runShellCommand(commandOption.command);
      spinner.stop();

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Command executed successfully!'));
        if (result.output) {
          console.log(chalk.gray('\nOutput:'));
          console.log(result.output);
        }
      } else {
        console.log(chalk.red.bold('\n❌ Command failed!'));
        if (result.error) {
          console.log(chalk.red('\nError:'));
          console.log(result.error);
        }
      }
    } catch (error) {
      spinner.stop();
      console.log(chalk.red.bold('\n❌ Execution failed!'));
      console.log(chalk.red(`Error: ${error.message}`));
    }
  }

  private runShellCommand(command: string): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output.trim() || undefined,
          error: error.trim() || undefined,
        });
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
        });
      });
    });
  }

  private getRiskColor(risk: string): (text: string) => string {
    switch (risk) {
      case 'low':
        return chalk.green;
      case 'medium':
        return chalk.yellow;
      case 'high':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }

  @Option({
    flags: '-i, --instruction <instruction>',
    description: 'Natural language instruction to convert',
  })
  parseInstruction(val: string): string {
    return val;
  }

  @Option({
    flags: '-d, --dry',
    description: 'Show commands without executing them',
  })
  parseDry(): boolean {
    return true;
  }
} 
