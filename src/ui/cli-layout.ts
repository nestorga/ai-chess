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

  // Board display (left side - 40%)
  boardBox = blessed.box({
    top: 0,
    left: 0,
    width: '40%',
    height: '80%',
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

  // Working memory display (right side - 60%)
  memoryBox = blessed.box({
    top: 0,
    left: '40%',
    width: '60%',
    height: '80%',
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
      },
      focus: {
        border: {
          fg: 'yellow'
        }
      }
    },
    label: ' AI Working Memory (Tab to focus, ↑↓ to scroll) ',
    keys: true,
    vi: true,
    mouse: false,
    focusable: true
  });

  // Status bar (bottom - 20% for better visibility)
  statusBox = blessed.box({
    top: '80%',
    left: 0,
    width: '100%',
    height: '20%',
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

  // Enable TAB to cycle focus between elements
  screen.key(['tab'], () => {
    screen.focusNext();
    screen.render();
  });

  // Enable S-TAB (Shift-Tab) to cycle backwards
  screen.key(['S-tab'], () => {
    screen.focusPrevious();
    screen.render();
  });

  // Global quit handler with proper focus management
  screen.key(['q', 'C-c'], () => {
    // Show confirmation dialog
    const confirmBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 50,
      height: 7,
      content: '{center}{bold}Quit game?{/bold}{/center}\n\n{center}Press {green-fg}Y{/green-fg} to quit, {yellow-fg}N{/yellow-fg} or {yellow-fg}ESC{/yellow-fg} to continue{/center}',
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
      label: ' Confirm Quit ',
      keys: true,
      vi: true
    });

    screen.append(confirmBox);
    confirmBox.focus();
    screen.render();

    // Handle keys on the confirm box
    confirmBox.key(['y', 'Y'], () => {
      cleanupScreen();
      process.exit(0);
    });

    confirmBox.key(['n', 'N', 'escape'], () => {
      confirmBox.detach();
      screen.render();
    });
  });

  // Display help text in status bar
  statusBox.setContent(`\n  {yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Q{/cyan-fg} - Quit  |  {cyan-fg}Enter{/cyan-fg} - Submit move`);

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
  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Q{/cyan-fg} - Quit  |  {cyan-fg}Enter{/cyan-fg} - Submit move`;
  if (statusMessage) {
    statusBox!.setContent(`\n  {bold}{white-fg}${statusMessage}{/white-fg}{/bold}\n\n  ${helpText}`);
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
  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Q{/cyan-fg} - Quit`;
  if (statusMessage) {
    statusBox!.setContent(`\n  {bold}{white-fg}${statusMessage}{/white-fg}{/bold}\n\n  ${helpText}`);
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

  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Q{/cyan-fg} - Quit  |  {cyan-fg}Enter{/cyan-fg} - Submit move`;
  statusBox!.setContent(`\n  {bold}{white-fg}${message}{/white-fg}{/bold}\n\n  ${helpText}`);
  screen!.render();
}

export function getScreen(): blessed.Widgets.Screen | null {
  return screen;
}
