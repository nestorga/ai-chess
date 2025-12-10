#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { humanVsAIGame, aiVsAIGame } from './game/game-loop.js';
import type { Color, ModelName } from './types/chess-types.js';
import { isValidModelName } from './types/model-types.js';

const program = new Command();

program
  .name('ai-chess')
  .description('AI Chess Agent powered by Claude Haiku with strategic working memory')
  .version('1.0.0');

program
  .command('play')
  .description('Start a new chess game')
  .option('-m, --mode <mode>', 'Game mode: human-ai or ai-ai', 'human-ai')
  .option('-c, --color <color>', 'Your color when playing vs AI (white/black)', 'white')
  .option('--model <model>', 'AI model: haiku, sonnet, or opus', 'haiku')
  .option('--white-model <model>', 'White AI model (AI vs AI only): haiku, sonnet, or opus')
  .option('--black-model <model>', 'Black AI model (AI vs AI only): haiku, sonnet, or opus')
  .action(async (options) => {
    const mode = options.mode;
    const color = options.color.toLowerCase();

    if (!['human-ai', 'ai-ai'].includes(mode)) {
      console.error(chalk.red('Error: Mode must be either "human-ai" or "ai-ai"'));
      process.exit(1);
    }

    if (mode === 'human-ai' && !['white', 'black'].includes(color)) {
      console.error(chalk.red('Error: Color must be either "white" or "black"'));
      process.exit(1);
    }

    // Model validation
    const modelName = options.model || 'haiku';
    const whiteModelName = options.whiteModel;
    const blackModelName = options.blackModel;

    // Validate main model
    if (!isValidModelName(modelName)) {
      console.error(chalk.red('Error: Model must be "haiku", "sonnet", or "opus"'));
      process.exit(1);
    }

    // For AI vs AI: validate white/black models if provided
    if (mode === 'ai-ai') {
      if (whiteModelName && !isValidModelName(whiteModelName)) {
        console.error(chalk.red('Error: --white-model must be "haiku", "sonnet", or "opus"'));
        process.exit(1);
      }
      if (blackModelName && !isValidModelName(blackModelName)) {
        console.error(chalk.red('Error: --black-model must be "haiku", "sonnet", or "opus"'));
        process.exit(1);
      }
    }

    // Warn if white/black models used in human-ai mode
    if (mode === 'human-ai' && (whiteModelName || blackModelName)) {
      console.warn(chalk.yellow('Warning: --white-model and --black-model are ignored in human-ai mode. Use --model instead.'));
    }

    try {
      if (mode === 'ai-ai') {
        // Use specific models if provided, otherwise use main model for both
        const whiteModel = whiteModelName ? whiteModelName as ModelName : modelName as ModelName;
        const blackModel = blackModelName ? blackModelName as ModelName : modelName as ModelName;
        await aiVsAIGame(whiteModel, blackModel);
      } else {
        await humanVsAIGame(color as Color, modelName as ModelName);
      }
    } catch (error) {
      console.error(chalk.red(`\nGame error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse();
