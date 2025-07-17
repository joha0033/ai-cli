import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CommandOption } from './command-parser.service';

@Injectable()
export class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async convertToCommands(instruction: string): Promise<CommandOption[]> {
    if (!this.openai) {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      );
    }

    const systemPrompt = `You are a helpful assistant that converts natural language instructions into bash/shell commands. 

For each instruction, provide 2-4 different command options that could fulfill the request. Each option should include:
1. The exact bash command
2. A brief description of what the command does
3. A risk level (low, medium, high) based on potential impact

Risk levels:
- low: Safe read-only operations (ls, pwd, cat, etc.)
- medium: Operations that modify files or install packages (mkdir, touch, git operations, npm install)
- high: Potentially destructive operations (rm -rf, system modifications, etc.)

Respond with a JSON array of objects with this structure:
[
  {
    "command": "exact bash command",
    "description": "brief description",
    "risk": "low|medium|high"
  }
]

Important guidelines:
- Always provide safe, commonly used commands
- Avoid dangerous operations unless specifically requested
- If the instruction is unclear, provide general helpful commands
- For file operations, use placeholders like 'filename' or 'directory' if no specific name is given
- Prefer cross-platform commands when possible
- Include helpful flags and options (like -la for ls)`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: instruction },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const commands = JSON.parse(content) as CommandOption[];

      // Validate the response structure
      if (!Array.isArray(commands)) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Validate each command object
      for (const cmd of commands) {
        if (!cmd.command || !cmd.description || !cmd.risk) {
          throw new Error('Invalid command structure from OpenAI');
        }
        if (!['low', 'medium', 'high'].includes(cmd.risk)) {
          cmd.risk = 'medium'; // Default to medium if invalid
        }
      }

      return commands;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Failed to parse OpenAI response:', error.message);
        throw new Error('Invalid JSON response from OpenAI');
      }

      if (error.code === 'insufficient_quota') {
        throw new Error(
          'OpenAI API quota exceeded. Please check your billing.'
        );
      }

      if (error.code === 'invalid_api_key') {
        throw new Error(
          'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.'
        );
      }

      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}
