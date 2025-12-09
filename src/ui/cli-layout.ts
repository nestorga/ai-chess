import blessed from 'blessed';
import chalk from 'chalk';
import { renderBoard } from './board-renderer.js';
import { formatWorkingMemory } from './memory-display.js';
import type { GameEngine } from '../game/game-engine.js';

let screen: blessed.Widgets.Screen | null = null;
let boardBox: blessed.Widgets.BoxElement | null = null;
let memoryBox: blessed.Widgets.ScrollableBoxElement | null = null;
let statusBox: blessed.Widgets.BoxElement | null = null;

export function initializeScreen(): void {
  if (screen) return;

  screen = blessed.screen({
    smartCSR: true,
    title: 'AI Chess Match',
    fullUnicode: true
  });

  // Board display (left side - 60%)
  boardBox = blessed.box({
    top: 0,
    left: 0,
    width: '60%',
    height: '85%',
    content: '',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      }
    },
    label: ' Chess Board '
  });

  // Working memory display (right side - 40%)
  memoryBox = blessed.box({
    top: 0,
    left: '60%',
    width: '40%',
    height: '85%',
    content: '',
    tags: true,
    border: {
      type: 'line'
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: {
        bg: 'yellow'
      }
    },
    style: {
      fg: 'white',
      border: {
        fg: 'magenta'
      }
    },
    label: ' AI Working Memory (↑↓ to scroll) ',
    keys: true,
    vi: true,
    mouse: false
  });

  // Status bar (bottom - 15%)
  statusBox = blessed.box({
    top: '85%',
    left: 0,
    width: '100%',
    height: '15%',
    content: '',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'yellow'
      }
    },
    label: ' Status '
  });

  screen.append(boardBox);
  screen.append(memoryBox);
  screen.append(statusBox);

  // Enable scrolling in memory box with arrow keys
  memoryBox.focus();

  // Quit on Escape, q, or Control-C (with confirmation)
  screen.key(['escape', 'q', 'C-c'], () => {
    // Show confirmation dialog
    const confirmBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 50,
      height: 7,
      content: '\n  {bold}Quit game?{/bold}\n\n  Press {green-fg}Y{/green-fg} to quit, {red-fg}N{/red-fg} to continue',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'red',
        border: {
          fg: 'red'
        }
      },
      label: ' Confirm Quit '
    });

    screen.append(confirmBox);
    confirmBox.focus();
    screen.render();

    const onKey = (ch: any, key: any) => {
      if (key.name === 'y') {
        cleanupScreen();
        process.exit(0);
      } else if (key.name === 'n' || key.name === 'escape') {
        confirmBox.detach();
        screen.render();
        screen.removeListener('keypress', onKey);
      }
    };

    screen.on('keypress', onKey);
  });

  // Display help text in status bar
  statusBox.setContent(`\n  {yellow-fg}Commands:{/yellow-fg} {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}↑↓{/cyan-fg} - Scroll Memory  |  {cyan-fg}Enter{/cyan-fg} - Submit Move`);

  screen.render();
}

export function displayGameState(
  game: GameEngine,
  workingMemory?: string,
  statusMessage?: string
): void {
  if (!screen || !boardBox || !memoryBox || !statusBox) {
    initializeScreen();
  }

  const board = renderBoard(game.getFEN(), game.getLastMove());
  const turn = game.getTurn();
  const moveNumber = game.getMoveNumber();

  // Update board display
  const boardContent = `
{center}{bold}{cyan-fg}AI CHESS MATCH{/cyan-fg}{/bold}{/center}

${board}

{bold}{yellow-fg}Move #${moveNumber} - ${turn === 'white' ? "White's" : "Black's"} turn{/yellow-fg}{/bold}
${game.isCheck() ? '{bold}{red-fg}⚠️  CHECK! ' + (turn === 'white' ? 'White' : 'Black') + ' king is in check!{/red-fg}{/bold}' : ''}
`;

  boardBox!.setContent(boardContent);

  // Update memory display
  if (workingMemory) {
    const formattedMemory = formatWorkingMemory(workingMemory);
    memoryBox!.setContent(formattedMemory);
    memoryBox!.setScrollPerc(0); // Scroll to top
  } else {
    memoryBox!.setContent('{center}{gray-fg}No working memory yet...{/gray-fg}{/center}');
  }

  // Update status with message and help text
  const helpText = `{yellow-fg}Commands:{/yellow-fg} {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}↑↓{/cyan-fg} - Scroll Memory  |  {cyan-fg}Enter{/cyan-fg} - Submit Move`;
  if (statusMessage) {
    statusBox!.setContent(`\n  {bold}{white-fg}${statusMessage}{/white-fg}{/bold}\n  ${helpText}`);
  } else {
    statusBox!.setContent(`\n  ${helpText}`);
  }

  screen!.render();
}

export function displayDualAgentState(
  game: GameEngine,
  whiteMemory?: string,
  blackMemory?: string,
  statusMessage?: string
): void {
  if (!screen || !boardBox || !memoryBox || !statusBox) {
    initializeScreen();
  }

  const board = renderBoard(game.getFEN(), game.getLastMove());
  const turn = game.getTurn();
  const moveNumber = game.getMoveNumber();

  // Update board display
  const boardContent = `
{center}{bold}{cyan-fg}AI vs AI CHESS MATCH{/cyan-fg}{/bold}{/center}

${board}

{bold}{yellow-fg}Move #${moveNumber} - ${turn === 'white' ? "White's" : "Black's"} turn{/yellow-fg}{/bold}
${game.isCheck() ? '{bold}{red-fg}⚠️  CHECK! ' + (turn === 'white' ? 'White' : 'Black') + ' king is in check!{/red-fg}{/bold}' : ''}
`;

  boardBox!.setContent(boardContent);

  // Update memory display with both agents' memories side by side
  const whiteFormatted = whiteMemory ? formatWorkingMemory(whiteMemory) : '{gray-fg}No memory yet...{/gray-fg}';
  const blackFormatted = blackMemory ? formatWorkingMemory(blackMemory) : '{gray-fg}No memory yet...{/gray-fg}';

  const dualMemoryContent = `
{center}{bold}{white-fg}WHITE AGENT{/white-fg} | {white-fg}BLACK AGENT{/white-fg}{/bold}{/center}
{yellow-fg}${'─'.repeat(38)}{/yellow-fg}

{bold}{white-fg}White's Strategy:{/white-fg}{/bold}
${whiteFormatted}

{yellow-fg}${'─'.repeat(38)}{/yellow-fg}

{bold}{white-fg}Black's Strategy:{/white-fg}{/bold}
${blackFormatted}
`;

  memoryBox!.setContent(dualMemoryContent);
  memoryBox!.setScrollPerc(0);

  // Update status with message and help text
  const helpText = `{yellow-fg}Commands:{/yellow-fg} {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}↑↓{/cyan-fg} - Scroll Memory`;
  if (statusMessage) {
    statusBox!.setContent(`\n  {bold}{white-fg}${statusMessage}{/white-fg}{/bold}\n  ${helpText}`);
  } else {
    statusBox!.setContent(`\n  ${helpText}`);
  }

  screen!.render();
}

export function displayGameOver(
  game: GameEngine,
  winner: 'white' | 'black' | 'draw',
  reason: string
): void {
  if (!screen || !boardBox || !statusBox) {
    initializeScreen();
  }

  const board = renderBoard(game.getFEN());

  const gameOverContent = `
{center}{bold}{cyan-fg}${'═'.repeat(40)}{/cyan-fg}{/bold}{/center}
{center}{bold}{white-fg}GAME OVER{/white-fg}{/bold}{/center}
{center}{bold}{cyan-fg}${'═'.repeat(40)}{/cyan-fg}{/bold}{/center}

${board}

${winner === 'draw'
    ? `{center}{bold}{yellow-fg}Result: Draw by ${reason}{/yellow-fg}{/bold}{/center}`
    : `{center}{bold}{green-fg}Winner: ${winner.toUpperCase()} by ${reason}!{/green-fg}{/bold}{/center}`
}

{center}{gray-fg}Total moves: ${game.getMoveNumber()}{/gray-fg}{/center}
`;

  boardBox!.setContent(gameOverContent);
  statusBox!.setContent('\n  {yellow-fg}Press any key to continue...{/yellow-fg}');

  screen!.render();

  // Wait for keypress before continuing
  screen!.onceKey(['enter', 'space', 'escape'], () => {
    // Don't clean up screen here, let the calling code handle it
  });
}

export function cleanupScreen(): void {
  if (screen) {
    screen.destroy();
    screen = null;
    boardBox = null;
    memoryBox = null;
    statusBox = null;
  }
}

export function displayMessage(message: string): void {
  if (!screen || !statusBox) {
    initializeScreen();
  }

  const helpText = `{yellow-fg}Commands:{/yellow-fg} {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}↑↓{/cyan-fg} - Scroll Memory  |  {cyan-fg}Enter{/cyan-fg} - Submit Move`;
  statusBox!.setContent(`\n  {bold}{white-fg}${message}{/white-fg}{/bold}\n  ${helpText}`);
  screen!.render();
}

export function getScreen(): blessed.Widgets.Screen | null {
  return screen;
}
