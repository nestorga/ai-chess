import blessed from 'blessed';
import { GameEngine } from './game-engine.js';
import { gameState } from './game-state.js';
import { saveGame } from './game-persistence.js';
import { createChessAgent } from '../mastra/agents/chess-agent.js';
import { displayGameState, displayDualAgentState, displayGameOver, initializeScreen, cleanupScreen, getScreen, displayMessage } from '../ui/cli-layout.js';
import { logError, logInfo } from '../utils/error-logger.js';
import type { Color, GameResult } from '../types/chess-types.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractMoveFromResponse(response: string): string | null {
  const movePattern = /\b([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?)\b/g;
  const matches = response.match(movePattern);

  if (matches && matches.length > 0) {
    return matches[matches.length - 1];
  }

  return null;
}

async function promptForMove(validMoves: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const screen = getScreen();
    if (!screen) {
      throw new Error('Screen not initialized');
    }

    displayMessage('Your move? (or "moves" to see valid moves)');

    // Create input box at the bottom
    const inputBox = blessed.textbox({
      bottom: 3,
      left: 2,
      height: 3,
      width: '50%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: 'green'
        }
      },
      label: ' Enter Move ',
      keys: true,
      inputOnFocus: true
    });

    screen.append(inputBox);
    inputBox.focus();

    // Handle ESC/Q to show quit confirmation dialog
    inputBox.key(['escape', 'C-c'], () => {
      // Show quit confirmation
      const confirmBox = blessed.box({
        top: 'center',
        left: 'center',
        width: 50,
        height: 7,
        content: '\n  {bold}Quit game?{/bold}\n\n  Press {green-fg}Y{/green-fg} to quit, {yellow-fg}N{/yellow-fg} or {yellow-fg}ESC{/yellow-fg} to continue',
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

      const onConfirmKey = (ch: any, key: any) => {
        if (key.name === 'y') {
          confirmBox.detach();
          inputBox.detach();
          screen.removeListener('keypress', onConfirmKey);
          reject(new Error('User quit'));
        } else if (key.name === 'n' || key.name === 'escape') {
          confirmBox.detach();
          inputBox.focus();
          screen.render();
          screen.removeListener('keypress', onConfirmKey);
        }
      };

      screen.on('keypress', onConfirmKey);
    });

    inputBox.on('submit', (value: string) => {
      const move = value.trim();

      if (move.toLowerCase() === 'moves') {
        displayMessage(`Valid moves: ${validMoves.join(', ')}`);
        inputBox.clearValue();
        inputBox.focus();
        screen.render();
        return;
      }

      if (validMoves.includes(move)) {
        inputBox.detach();
        screen.render();
        resolve(move);
      } else {
        displayMessage(`Invalid move: "${move}". Try again.`);
        inputBox.clearValue();
        inputBox.focus();
        screen.render();
      }
    });

    screen.render();
  });
}

export async function humanVsAIGame(playerColor: Color): Promise<void> {
  initializeScreen();

  const game = new GameEngine();
  gameState.setGame(game);

  const aiColor = playerColor === 'white' ? 'black' : 'white';
  const { agent: aiAgent, memory: aiMemory } = createChessAgent(`AI-${aiColor.charAt(0).toUpperCase() + aiColor.slice(1)}`);

  logInfo(`Starting Human vs AI game - Player: ${playerColor}, AI: ${aiColor}`);

  displayMessage(`🎮 Starting Human vs AI game! You: ${playerColor.toUpperCase()}, AI: ${aiColor.toUpperCase()}`);
  await sleep(2000);

  // Persist AI working memory across turns
  let aiWorkingMemory = '';

  while (!game.isGameOver()) {
    const currentTurn = game.getTurn();

    if (currentTurn === playerColor) {
      displayGameState(game, aiWorkingMemory, 'Your turn! Make your move.');

      const validMoves = game.getValidMoves();

      let move: string;
      try {
        move = await promptForMove(validMoves);
      } catch (error) {
        // User quit during input
        return;
      }

      const result = game.executeMove(move);
      if (!result.success) {
        displayMessage(`Error: ${result.error}`);
        continue;
      }

      displayMessage(`✓ You played: ${move}`);
      await sleep(1000);
    } else {
      displayGameState(game, aiWorkingMemory, 'AI is thinking...');

      try {
        logInfo(`AI (${aiColor}) is generating move for position: ${game.getFEN()}`);

        const response = await aiAgent.generate(
          `It's your turn to move. You are playing as ${aiColor}. Analyze the position and make your move.`,
          {
            resourceId: game.getGameId(),
            threadId: `game-${game.getGameId()}`
          }
        );

        const responseText = response.text || '';

        // Retrieve working memory from the agent's memory instance
        try {
          const memory = await aiMemory.getWorkingMemory({
            resourceId: game.getGameId(),
            threadId: `game-${game.getGameId()}`
          });
          aiWorkingMemory = memory || '';
        } catch (err) {
          logError('Working Memory Retrieval', err);
        }

        logInfo(`AI response received. Text length: ${responseText.length}, Memory length: ${aiWorkingMemory.length}`);

        // Extract move from response for display (move was already executed by make-move tool)
        const move = extractMoveFromResponse(responseText);

        if (move) {
          displayGameState(game, aiWorkingMemory, `AI played: ${move}`);
          logInfo(`AI successfully played: ${move}`);
        } else {
          // Couldn't extract move from text, check if board changed
          displayGameState(game, aiWorkingMemory, 'AI made a move');
          const lastMove = game.getLastMove();
          if (lastMove) {
            displayMessage(`AI played: ${lastMove} (extracted from board)`);
            logInfo(`Move extracted from board: ${lastMove}`);
          } else {
            logError('Move Extraction Failed', new Error(`No move found in response: ${responseText.substring(0, 200)}`));
          }
        }

        await sleep(2000);
      } catch (error) {
        logError('AI Turn Error', error);
        displayMessage(`Error during AI turn - check chess-errors.log`);
        const validMoves = game.getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.executeMove(randomMove);
        displayMessage(`AI played (fallback): ${randomMove}`);
        logInfo(`Fallback move after error: ${randomMove}`);
        await sleep(3000);
      }
    }
  }

  const winner = game.getWinner();
  const reason = game.getGameOverReason();

  displayGameOver(game, winner!, reason);

  const result: GameResult = {
    winner: winner!,
    reason: reason as any,
    moveCount: game.getMoveNumber(),
    pgn: game.getPGN()
  };

  const whitePlayer = playerColor === 'white' ? 'Human' : `AI-${aiColor}`;
  const blackPlayer = playerColor === 'black' ? 'Human' : `AI-${aiColor}`;

  const savedPath = await saveGame(game, result, whitePlayer, blackPlayer, 'Human vs AI');

  // Wait for user to press a key before cleaning up
  await new Promise<void>(resolve => {
    const screen = getScreen();
    if (screen) {
      const handler = () => resolve();
      screen.once('keypress', handler);
    } else {
      resolve();
    }
  });

  cleanupScreen();

  console.log(`Game saved to: ${savedPath}\n`);

  gameState.clearGame();
}

export async function aiVsAIGame(): Promise<void> {
  initializeScreen();

  const game = new GameEngine();
  gameState.setGame(game);

  const { agent: whiteAgent, memory: whiteMemory } = createChessAgent('White-AI');
  const { agent: blackAgent, memory: blackMemory } = createChessAgent('Black-AI');

  logInfo('Starting AI vs AI game');

  displayMessage('🤖 Starting AI vs AI game! Watch two AI agents battle!');
  await sleep(2000);

  // Retrieve both working memories for display
  let whiteWorkingMemory = '';
  let blackWorkingMemory = '';

  while (!game.isGameOver()) {
    const currentTurn = game.getTurn();
    const currentAgent = currentTurn === 'white' ? whiteAgent : blackAgent;
    const currentMemory = currentTurn === 'white' ? whiteMemory : blackMemory;
    const currentColor = currentTurn;

    try {
      displayDualAgentState(
        game,
        whiteWorkingMemory,
        blackWorkingMemory,
        `${currentColor.toUpperCase()} AI is thinking...`
      );

      logInfo(`AI (${currentColor}) is generating move for position: ${game.getFEN()}`);

      const response = await currentAgent.generate(
        `It's your turn to move. You are playing as ${currentColor}. Analyze the position and make your move.`,
        {
          resourceId: game.getGameId(),
          threadId: `${currentColor}-thread`
        }
      );

      const responseText = response.text || '';

      // Retrieve working memory for this agent
      let workingMemory = '';
      try {
        const memory = await currentMemory.getWorkingMemory({
          resourceId: game.getGameId(),
          threadId: `${currentColor}-thread`
        });
        workingMemory = memory || '';

        // Update the appropriate memory
        if (currentColor === 'white') {
          whiteWorkingMemory = workingMemory;
        } else {
          blackWorkingMemory = workingMemory;
        }
      } catch (err) {
        logError(`${currentColor} Working Memory Retrieval`, err);
      }

      logInfo(`AI (${currentColor}) response received. Text length: ${responseText.length}, Memory length: ${workingMemory.length}`);

      // Extract move from response for display (move was already executed by make-move tool)
      const move = extractMoveFromResponse(responseText);

      if (move) {
        displayDualAgentState(game, whiteWorkingMemory, blackWorkingMemory, `${currentColor.toUpperCase()} played: ${move}`);
        logInfo(`AI (${currentColor}) successfully played: ${move}`);
      } else {
        // Couldn't extract move from text, check if board changed
        const lastMove = game.getLastMove();
        if (lastMove) {
          displayDualAgentState(game, whiteWorkingMemory, blackWorkingMemory, `${currentColor.toUpperCase()} played: ${lastMove}`);
          logInfo(`Move extracted from board: ${lastMove}`);
        } else {
          logError(`${currentColor} Move Extraction Failed`, new Error(`No move in response: ${responseText.substring(0, 200)}`));
        }
      }

      await sleep(3000);
    } catch (error) {
      logError(`${currentColor} AI Turn Error`, error);
      displayMessage(`Error during ${currentColor.toUpperCase()} AI turn - check chess-errors.log`);
      const validMoves = game.getValidMoves();
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      game.executeMove(randomMove);
      displayMessage(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`);
      logInfo(`Fallback move after error: ${randomMove}`);
      await sleep(3000);
    }
  }

  const winner = game.getWinner();
  const reason = game.getGameOverReason();

  displayGameOver(game, winner!, reason);

  const result: GameResult = {
    winner: winner!,
    reason: reason as any,
    moveCount: game.getMoveNumber(),
    pgn: game.getPGN()
  };

  const savedPath = await saveGame(game, result, 'White-AI', 'Black-AI', 'AI vs AI');

  // Wait for user to press a key before cleaning up
  await new Promise<void>(resolve => {
    const screen = getScreen();
    if (screen) {
      const handler = () => resolve();
      screen.once('keypress', handler);
    } else {
      resolve();
    }
  });

  cleanupScreen();

  console.log(`Game saved to: ${savedPath}\n`);

  gameState.clearGame();
}
