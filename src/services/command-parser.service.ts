import { Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';

export interface CommandOption {
  command: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

@Injectable()
export class CommandParserService {
  constructor(private readonly openaiService: OpenAIService) {}

  async parseNaturalLanguage(input: string): Promise<CommandOption[]> {
    // Try OpenAI first if configured
    if (this.openaiService.isConfigured()) {
      try {
        const commands = await this.openaiService.convertToCommands(input);
        if (commands.length > 0) {
          return commands;
        }
      } catch (error) {
        console.warn(
          'OpenAI API failed, falling back to pattern matching:',
          error.message
        );
      }
    }

    // Fallback to pattern matching
    return this.parseWithPatterns(input);
  }

  private parseWithPatterns(input: string): CommandOption[] {
    const normalizedInput = input.toLowerCase().trim();
    const commands: CommandOption[] = [];

    // File and directory operations
    if (
      this.matches(normalizedInput, [
        'list',
        'show',
        'files',
        'directory',
        'dir',
      ])
    ) {
      commands.push({
        command: 'ls -la',
        description: 'List all files and directories with details',
        risk: 'low',
      });
      commands.push({
        command: 'find . -type f -name "*" | head -20',
        description: 'Find and list first 20 files in current directory',
        risk: 'low',
      });
    }

    if (
      this.matches(normalizedInput, [
        'create',
        'make',
        'new',
        'folder',
        'directory',
      ])
    ) {
      const dirName = this.extractDirectoryName(normalizedInput);
      commands.push({
        command: `mkdir -p ${dirName || 'new_directory'}`,
        description: `Create directory: ${dirName || 'new_directory'}`,
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['create', 'make', 'new', 'file'])) {
      const fileName = this.extractFileName(normalizedInput);
      commands.push({
        command: `touch ${fileName || 'new_file.txt'}`,
        description: `Create empty file: ${fileName || 'new_file.txt'}`,
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['delete', 'remove', 'rm'])) {
      if (this.matches(normalizedInput, ['file'])) {
        const fileName = this.extractFileName(normalizedInput);
        commands.push({
          command: `rm ${fileName || 'filename'}`,
          description: `Delete file: ${fileName || 'filename'}`,
          risk: 'medium',
        });
      } else if (this.matches(normalizedInput, ['directory', 'folder'])) {
        const dirName = this.extractDirectoryName(normalizedInput);
        commands.push({
          command: `rm -rf ${dirName || 'directory'}`,
          description: `Delete directory and all contents: ${dirName || 'directory'}`,
          risk: 'high',
        });
      }
    }

    // Git operations
    if (this.matches(normalizedInput, ['git', 'status', 'check'])) {
      commands.push({
        command: 'git status',
        description: 'Show git repository status',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['git', 'add', 'stage'])) {
      commands.push({
        command: 'git add .',
        description: 'Stage all changes for commit',
        risk: 'low',
      });
      commands.push({
        command: 'git add -A',
        description: 'Stage all changes including deletions',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['git', 'commit'])) {
      commands.push({
        command: 'git commit -m "Update"',
        description: 'Commit staged changes with generic message',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['git', 'push'])) {
      commands.push({
        command: 'git push origin main',
        description: 'Push commits to main branch',
        risk: 'medium',
      });
      commands.push({
        command: 'git push',
        description: 'Push commits to current branch',
        risk: 'medium',
      });
    }

    if (this.matches(normalizedInput, ['git', 'pull'])) {
      commands.push({
        command: 'git pull origin main',
        description: 'Pull latest changes from main branch',
        risk: 'medium',
      });
      commands.push({
        command: 'git pull',
        description: 'Pull latest changes from current branch',
        risk: 'medium',
      });
    }

    // System operations
    if (
      this.matches(normalizedInput, [
        'current',
        'directory',
        'where',
        'location',
      ])
    ) {
      commands.push({
        command: 'pwd',
        description: 'Show current directory path',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['disk', 'space', 'usage', 'size'])) {
      commands.push({
        command: 'df -h',
        description: 'Show disk space usage',
        risk: 'low',
      });
      commands.push({
        command: 'du -sh *',
        description: 'Show size of files and directories',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['processes', 'running', 'tasks'])) {
      commands.push({
        command: 'ps aux',
        description: 'Show all running processes',
        risk: 'low',
      });
      commands.push({
        command: 'top',
        description: 'Show real-time process activity',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['find', 'search'])) {
      const searchTerm = this.extractSearchTerm(normalizedInput);
      commands.push({
        command: `find . -name "*${searchTerm || 'search_term'}*"`,
        description: `Find files containing: ${searchTerm || 'search_term'}`,
        risk: 'low',
      });
      commands.push({
        command: `grep -r "${searchTerm || 'search_term'}" .`,
        description: `Search for text in files: ${searchTerm || 'search_term'}`,
        risk: 'low',
      });
    }

    // Package management
    if (this.matches(normalizedInput, ['install', 'npm', 'pnpm', 'package'])) {
      const packageName = this.extractPackageName(normalizedInput);
      commands.push({
        command: `pnpm install ${packageName || 'package_name'}`,
        description: `Install package: ${packageName || 'package_name'}`,
        risk: 'medium',
      });
    }

    if (this.matches(normalizedInput, ['run', 'start', 'dev', 'serve'])) {
      commands.push({
        command: 'pnpm run dev',
        description: 'Start development server',
        risk: 'low',
      });
      commands.push({
        command: 'pnpm start',
        description: 'Start application',
        risk: 'low',
      });
    }

    if (this.matches(normalizedInput, ['build', 'compile'])) {
      commands.push({
        command: 'pnpm run build',
        description: 'Build the application',
        risk: 'low',
      });
    }

    // If no specific commands found, provide some general suggestions
    if (commands.length === 0) {
      commands.push({
        command: 'ls -la',
        description: 'List current directory contents',
        risk: 'low',
      });
      commands.push({
        command: 'pwd',
        description: 'Show current directory path',
        risk: 'low',
      });
      commands.push({
        command: 'help',
        description: 'Show available commands',
        risk: 'low',
      });
    }

    return commands;
  }

  private matches(input: string, keywords: string[]): boolean {
    return keywords.some((keyword) => input.includes(keyword));
  }

  private extractDirectoryName(input: string): string | null {
    const match = input.match(
      /(?:folder|directory|dir)\s+(?:called|named)?\s*['"]?([^'"]+)['"]?/i
    );
    return match ? match[1].trim() : null;
  }

  private extractFileName(input: string): string | null {
    const match = input.match(
      /(?:file)\s+(?:called|named)?\s*['"]?([^'"]+)['"]?/i
    );
    return match ? match[1].trim() : null;
  }

  private extractSearchTerm(input: string): string | null {
    const match = input.match(
      /(?:find|search)\s+(?:for)?\s*['"]?([^'"]+)['"]?/i
    );
    return match ? match[1].trim() : null;
  }

  private extractPackageName(input: string): string | null {
    const match = input.match(
      /(?:install|add)\s+(?:package)?\s*['"]?([^'"]+)['"]?/i
    );
    return match ? match[1].trim() : null;
  }
}
