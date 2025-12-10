import { GameEngine } from './game-engine.js';
import { gameState } from './game-state.js';
import { saveGame } from './game-persistence.js';
import { createChessAgent } from '../mastra/agents/chess-agent.js';
import { displayGameState, displayDualAgentState, displayGameOver, initializeScreen, cleanupScreen, getScreen, getInputBox, getMemoryBox, setInputContent, displayMessage, setInputActive } from '../ui/cli-layout.js';
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
  return new Promise((resolve) => {
    const screen = getScreen();
    const inputBox = getInputBox();
    const memoryBox = getMemoryBox();

    if (!screen || !inputBox || !memoryBox) {
      throw new Error('UI not initialized');
    }

    // Show input box and clear buffer
    let inputBuffer = '';
    inputBox.show();
    setInputContent('');  // Clear with prefix (will show "> ")

    // Set input active flag for global handler coordination
    setInputActive(true);

    // Display prompt with all valid moves (add line breaks every 16 moves for readability)
    const movesPerLine = 16;
    const movesLines: string[] = [];
    for (let i = 0; i < validMoves.length; i += movesPerLine) {
      movesLines.push('  ' + validMoves.slice(i, i + movesPerLine).join(', '));
    }
    const movesText = `  Valid moves:\n${movesLines.join('\n')}`;
    displayMessage(`Your move?\n\n${movesText}`);
    inputBox.focus();
    screen.render();

    // Handle keypresses at screen level
    const keypressHandler = (ch: string, key: any) => {
      // Note: Ctrl+C, Q, ESC, and Tab are now handled by global handler

      // Only process other keys when input box is focused
      if (screen.focused !== inputBox) {
        return;
      }

      // Enter: Submit
      if (key.name === 'enter') {
        const move = inputBuffer.trim();

        if (validMoves.includes(move)) {
          // Valid move
          cleanup();
          inputBox.hide();
          memoryBox.focus();  // Auto-focus memory for scrolling during AI turn
          screen.render();
          resolve(move);
        } else {
          // Invalid move - redisplay prompt with valid moves
          displayMessage(`Invalid move: "${move}". Try again.\n\n${movesText}`);
          inputBuffer = '';
          setInputContent('');  // Clear (prefix ensures visibility)
          inputBox.focus();  // Refocus input box after invalid move
          screen.render();
        }
        return;
      }

      // Backspace: Remove last character
      if (key.name === 'backspace') {
        inputBuffer = inputBuffer.slice(0, -1);
        setInputContent(inputBuffer);
        screen.render();
        return;
      }

      // Regular character: Add to buffer
      if (ch && ch.length === 1 && !key.ctrl && !key.meta) {
        inputBuffer += ch;
        setInputContent(inputBuffer);
        screen.render();
      }
    };

    // Cleanup function
    const cleanup = () => {
      setInputActive(false);  // Clear input active flag
      screen.removeListener('keypress', keypressHandler);
    };

    // Attach handler
    screen.on('keypress', keypressHandler);
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
      const move = await promptForMove(validMoves);

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
          threadId: `${currentColor}-${game.getGameId()}`
        }
      );

      const responseText = response.text || '';

      // Retrieve working memory for this agent
      let workingMemory = '';
      try {
        const memory = await currentMemory.getWorkingMemory({
          resourceId: game.getGameId(),
          threadId: `${currentColor}-${game.getGameId()}`
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
