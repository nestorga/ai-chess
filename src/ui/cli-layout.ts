import blessed from 'blessed';
import chalk from 'chalk';
import { renderBoard } from './board-renderer.js';
import { formatWorkingMemory } from './memory-display.js';
import type { GameEngine } from '../game/game-engine.js';

let screen: blessed.Widgets.Screen | null = null;
let boardBox: blessed.Widgets.BoxElement | null = null;
let memoryBox: blessed.Widgets.ScrollableBoxElement | null = null;
let statusBox: blessed.Widgets.BoxElement | null = null;
let inputBox: blessed.Widgets.BoxElement | null = null;

// State management for global keypress handler
let isInputActive = false;
let globalKeyHandler: ((ch: string, key: any) => void) | null = null;

export function initializeScreen(): void {
  if (screen) return;

  screen = blessed.screen({
    smartCSR: true,
    title: 'AI Chess Match',
    fullUnicode: true
  });

  // Board display (top left - 40% width, 50% height)
  boardBox = blessed.box({
    top: 0,
    left: 0,
    width: '40%',
    height: '50%',
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
    label: ' Chess Board ',
    focusable: false
  });

  // Status bar (bottom left - 40% width, 50% height)
  statusBox = blessed.box({
    top: '50%',
    left: 0,
    width: '40%',
    height: '50%',
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
    label: ' Status ',
    focusable: false
  });

  // Working memory display (full right side - 60% width, 100% height)
  memoryBox = blessed.box({
    top: 0,
    left: '40%',
    width: '60%',
    height: '100%',
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

  screen.append(boardBox);
  screen.append(memoryBox);
  screen.append(statusBox);

  // Create simple input display box (NOT textbox or form)
  inputBox = blessed.box({
    parent: screen,
    bottom: 3,
    left: 2,
    width: '50%',
    height: 3,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'blue',
      border: {
        fg: 'green'
      },
      focus: {
        border: {
          fg: 'yellow'
        }
      }
    },
    label: ' Enter Move ',
    content: '',  // We'll update this manually
    tags: false,  // No tag processing needed
    hidden: true,  // Initially hidden, shown when prompting for move
    focusable: true
  });

  // Display help text in status bar
  statusBox.setContent(`\n  {yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Enter{/cyan-fg} - Submit move`);

  // Attach global keypress handler
  setupGlobalKeyHandler();

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
  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Enter{/cyan-fg} - Submit move`;
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
  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory`;
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
  if (screen && globalKeyHandler) {
    screen.removeListener('keypress', globalKeyHandler);
    globalKeyHandler = null;
  }

  if (screen) {
    screen.destroy();
    screen = null;
    boardBox = null;
    memoryBox = null;
    statusBox = null;
    inputBox = null;
  }
}

function setupGlobalKeyHandler(): void {
  if (!screen) return;

  globalKeyHandler = async (ch: string, key: any) => {
    // Ctrl+C, Q, ESC: Always show quit confirmation
    if ((key.name === 'c' && key.ctrl) || key.name === 'q' || key.name === 'escape') {
      const shouldQuit = await confirmQuit();
      if (shouldQuit) {
        cleanupScreen();
        process.exit(0);
      }
      return;
    }

    // Tab: Focus switching (works anytime)
    if (key.name === 'tab' && !key.shift) {
      if (screen!.focused === inputBox && inputBox!.visible) {
        memoryBox?.focus();
      } else if (screen!.focused === memoryBox) {
        if (inputBox?.visible && isInputActive) {
          inputBox.focus();
        }
      }
      screen!.render();
      return;
    }
  };

  screen.on('keypress', globalKeyHandler);
}

async function confirmQuit(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!screen || !statusBox) {
      resolve(true);
      return;
    }

    // Save current content
    const originalContent = statusBox.getContent();

    // Show confirmation prompt
    statusBox.setContent('\n  {bold}{yellow-fg}Really quit? Press Y to quit, N or ESC to continue{/yellow-fg}{/bold}');
    screen.render();

    // Wait for Y or N or ESC
    const confirmHandler = (ch: string, key: any) => {
      if (key.name === 'y' || ch === 'y' || ch === 'Y') {
        screen!.removeListener('keypress', confirmHandler);
        resolve(true);
      } else if (key.name === 'n' || ch === 'n' || ch === 'N' || key.name === 'escape') {
        screen!.removeListener('keypress', confirmHandler);
        statusBox!.setContent(originalContent);
        screen!.render();
        resolve(false);
      }
      // Ignore all other keys during confirmation
    };

    screen.on('keypress', confirmHandler);
  });
}

function stripBlessedTags(text: string): string {
  return text.replace(/\{[^}]*\}/g, '');
}

export function displayMessage(message: string): void {
  if (!screen || !statusBox) {
    initializeScreen();
  }

  const helpText = `{yellow-fg}Commands:{/yellow-fg}\n  {cyan-fg}Q/ESC{/cyan-fg} - Quit  |  {cyan-fg}Tab{/cyan-fg} - Cycle focus  |  {cyan-fg}↑↓{/cyan-fg} - Scroll memory  |  {cyan-fg}Enter{/cyan-fg} - Submit move`;

  // Root cause: blessed doesn't clear characters beyond new content length
  // Solution: Pad based on DISPLAY length (after stripping tags) to 200 chars
  const paddedMessage = message.split('\n').map(line => {
    const displayLen = stripBlessedTags(line).length;
    return line + ' '.repeat(Math.max(0, 200 - displayLen));
  }).join('\n');

  const paddedHelp = helpText.split('\n').map(line => {
    const displayLen = stripBlessedTags(line).length;
    return line + ' '.repeat(Math.max(0, 200 - displayLen));
  }).join('\n');

  statusBox!.setContent(`\n  {bold}{white-fg}${paddedMessage}{/white-fg}{/bold}\n\n  ${paddedHelp}`);
  screen!.render();
}

export function getScreen(): blessed.Widgets.Screen | null {
  return screen;
}

export function getMemoryBox(): blessed.Widgets.ScrollableBoxElement | null {
  return memoryBox;
}

export function getInputBox(): blessed.Widgets.BoxElement | null {
  return inputBox;
}

export function setInputContent(text: string): void {
  if (inputBox) {
    // Root cause: blessed doesn't recognize updates from '' to 'x' as dirty
    // Solution: Always use a visible prefix so every update is different
    const displayText = '> ' + text;
    inputBox.setContent(displayText);
  }
}

export function setInputActive(active: boolean): void {
  isInputActive = active;
}
