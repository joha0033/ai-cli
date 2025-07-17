import { Module } from '@nestjs/common';
import { NaturalLanguageCommand } from './commands/natural-language.command';
import { CommandParserService } from './services/command-parser.service';

@Module({
  providers: [NaturalLanguageCommand, CommandParserService],
})
export class AppModule {} 
