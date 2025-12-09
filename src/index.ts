#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { humanVsAIGame, aiVsAIGame } from './game/game-loop.js';
import { listSavedGames, getGamePath, loadGame } from './game/game-persistence.js';
import type { Color } from './types/chess-types.js';

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

    try {
      if (mode === 'ai-ai') {
        await aiVsAIGame();
      } else {
        await humanVsAIGame(color as Color);
      }
    } catch (error) {
      console.error(chalk.red(`\nGame error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all saved games')
  .action(async () => {
    try {
      const games = await listSavedGames();

      if (games.length === 0) {
        console.log(chalk.yellow('\nNo saved games found.\n'));
        return;
      }

      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));
      console.log(chalk.bold.white('         SAVED GAMES'));
      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));

      games.forEach((game, index) => {
        console.log(chalk.white(`${index + 1}. ${game}`));
      });

      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));
      console.log(chalk.gray(`Total games: ${games.length}\n`));
    } catch (error) {
      console.error(chalk.red(`Error listing games: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('load <filename>')
  .description('Load and view a saved game')
  .action(async (filename) => {
    try {
      const filepath = await getGamePath(filename);
      const game = await loadGame(filepath);

      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));
      console.log(chalk.bold.white('         LOADED GAME'));
      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));

      console.log(chalk.white('\nPGN:'));
      console.log(chalk.gray(game.getPGN()));

      console.log(chalk.white('\n\nMove History:'));
      const moves = game.getHistory();
      for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = moves[i];
        const blackMove = moves[i + 1] || '';
        console.log(chalk.gray(`${moveNum}. ${whiteMove} ${blackMove}`));
      }

      console.log(chalk.bold.cyan('\n═══════════════════════════════════════\n'));
    } catch (error) {
      console.error(chalk.red(`Error loading game: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse();
