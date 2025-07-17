import { Module } from '@nestjs/common';
import { NaturalLanguageCommand } from './commands/natural-language.command';
import { CommandParserService } from './services/command-parser.service';
import { OpenAIService } from './services/openai.service';

@Module({
  providers: [NaturalLanguageCommand, CommandParserService, OpenAIService],
})
export class AppModule {}
