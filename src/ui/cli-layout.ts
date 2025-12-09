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
    label: ' AI Working Memory ',
    keys: true,
    vi: true,
    mouse: true
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

  // Quit on Escape, q, or Control-C
  screen.key(['escape', 'q', 'C-c'], () => {
    cleanupScreen();
    process.exit(0);
  });

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

  // Update status
  if (statusMessage) {
    statusBox!.setContent(`\n  {cyan-fg}${statusMessage}{/cyan-fg}`);
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

  // Update status
  if (statusMessage) {
    statusBox!.setContent(`\n  {cyan-fg}${statusMessage}{/cyan-fg}`);
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

  statusBox!.setContent(`\n  {cyan-fg}${message}{/cyan-fg}`);
  screen!.render();
}

export function getScreen(): blessed.Widgets.Screen | null {
  return screen;
}
