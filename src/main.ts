#!/usr/bin/env node

import 'dotenv/config';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['error', 'warn'],
    errorHandler: (err) => {
      console.error('Error:', err.message);
      process.exit(1);
    },
  });
}

bootstrap();
