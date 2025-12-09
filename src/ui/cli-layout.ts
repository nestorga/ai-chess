import chalk from 'chalk';
import { renderBoard } from './board-renderer.js';
import { formatWorkingMemory } from './memory-display.js';
import type { GameEngine } from '../game/game-engine.js';

export function displayGameState(
  game: GameEngine,
  workingMemory?: string,
  statusMessage?: string
): void {
  console.clear();

  const board = renderBoard(game.getFEN(), game.getLastMove());
  const turn = game.getTurn();
  const moveNumber = game.getMoveNumber();

  console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════════════════════════════════\n'));
  console.log(chalk.bold.white(`                             AI CHESS MATCH`));
  console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════════════════════════════════\n'));

  console.log(board);

  console.log(chalk.bold.yellow(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
  console.log(chalk.bold.white(`  Move #${moveNumber} - ${turn === 'white' ? "White's" : "Black's"} turn`));

  if (game.isCheck()) {
    console.log(chalk.bold.red(`  ⚠️  CHECK! ${turn === 'white' ? 'White' : 'Black'} king is in check!`));
  }

  if (statusMessage) {
    console.log(chalk.cyan(`  ${statusMessage}`));
  }

  console.log(chalk.bold.yellow(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));

  if (workingMemory) {
    console.log(chalk.bold.magenta('AI WORKING MEMORY:'));
    console.log(chalk.bold.yellow('─'.repeat(80)));
    console.log(formatWorkingMemory(workingMemory));
    console.log(chalk.bold.yellow('─'.repeat(80) + '\n'));
  }
}

export function displayDualAgentState(
  game: GameEngine,
  whiteMemory?: string,
  blackMemory?: string,
  statusMessage?: string
): void {
  console.clear();

  const board = renderBoard(game.getFEN(), game.getLastMove());
  const turn = game.getTurn();
  const moveNumber = game.getMoveNumber();

  console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════════════════════════════════\n'));
  console.log(chalk.bold.white(`                         AI vs AI CHESS MATCH`));
  console.log(chalk.bold.cyan('\n═══════════════════════════════════════════════════════════════════════════════════\n'));

  console.log(board);

  console.log(chalk.bold.yellow(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
  console.log(chalk.bold.white(`  Move #${moveNumber} - ${turn === 'white' ? "White's" : "Black's"} turn`));

  if (game.isCheck()) {
    console.log(chalk.bold.red(`  ⚠️  CHECK! ${turn === 'white' ? 'White' : 'Black'} king is in check!`));
  }

  if (statusMessage) {
    console.log(chalk.cyan(`  ${statusMessage}`));
  }

  console.log(chalk.bold.yellow(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));

  const columnWidth = 38;

  console.log(chalk.bold.white('  WHITE AGENT MEMORY') + ' '.repeat(columnWidth - 18) + chalk.bold.white('BLACK AGENT MEMORY'));
  console.log(chalk.yellow('  ' + '─'.repeat(columnWidth) + '  ' + '─'.repeat(columnWidth)));

  const whiteLines = (whiteMemory || 'No memory yet...').split('\n');
  const blackLines = (blackMemory || 'No memory yet...').split('\n');
  const maxLines = Math.max(whiteLines.length, blackLines.length, 10);

  for (let i = 0; i < Math.min(maxLines, 15); i++) {
    const whiteLine = whiteLines[i] || '';
    const blackLine = blackLines[i] || '';

    const whiteText = whiteLine.substring(0, columnWidth).padEnd(columnWidth);
    const blackText = blackLine.substring(0, columnWidth);

    process.stdout.write('  ' + chalk.gray(whiteText) + '  ' + chalk.gray(blackText) + '\n');
  }

  console.log(chalk.yellow('  ' + '─'.repeat(columnWidth) + '  ' + '─'.repeat(columnWidth) + '\n'));
}

export function displayGameOver(
  game: GameEngine,
  winner: 'white' | 'black' | 'draw',
  reason: string
): void {
  console.log('\n');
  console.log(chalk.bold.cyan('═'.repeat(80)));
  console.log(chalk.bold.white('                              GAME OVER'));
  console.log(chalk.bold.cyan('═'.repeat(80)));
  console.log('');

  if (winner === 'draw') {
    console.log(chalk.bold.yellow(`  Result: Draw by ${reason}`));
  } else {
    console.log(chalk.bold.green(`  Winner: ${winner.toUpperCase()} by ${reason}!`));
  }

  console.log('');
  console.log(chalk.gray(`  Final position:`));
  console.log(renderBoard(game.getFEN()));
  console.log(chalk.gray(`  Total moves: ${game.getMoveNumber()}`));
  console.log('');
  console.log(chalk.bold.cyan('═'.repeat(80) + '\n'));
}
