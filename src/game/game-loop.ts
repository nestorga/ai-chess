import readline from 'readline';
import chalk from 'chalk';
import { GameEngine } from './game-engine.js';
import { gameState } from './game-state.js';
import { saveGame } from './game-persistence.js';
import { createChessAgent } from '../mastra/agents/chess-agent.js';
import { displayGameState, displayDualAgentState, displayGameOver } from '../ui/cli-layout.js';
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(chalk.cyan('\nYour move? (or type "moves" to see valid moves, "quit" to exit)'));

    const askMove = () => {
      rl.question(chalk.white('> '), (input) => {
        const move = input.trim();

        if (move.toLowerCase() === 'quit') {
          rl.close();
          process.exit(0);
        }

        if (move.toLowerCase() === 'moves') {
          console.log(chalk.gray('\nValid moves:'));
          console.log(chalk.white(validMoves.join(', ')));
          askMove();
          return;
        }

        if (validMoves.includes(move)) {
          rl.close();
          resolve(move);
        } else {
          console.log(chalk.red(`Invalid move: "${move}". Please try again.`));
          askMove();
        }
      });
    };

    askMove();
  });
}

export async function humanVsAIGame(playerColor: Color): Promise<void> {
  const game = new GameEngine();
  gameState.setGame(game);

  const aiColor = playerColor === 'white' ? 'black' : 'white';
  const { agent: aiAgent, memory: aiMemory } = createChessAgent(`AI-${aiColor.charAt(0).toUpperCase() + aiColor.slice(1)}`);

  logInfo(`Starting Human vs AI game - Player: ${playerColor}, AI: ${aiColor}`);

  console.log(chalk.bold.green(`\n🎮 Starting Human vs AI game!`));
  console.log(chalk.white(`You are playing as ${chalk.bold(playerColor.toUpperCase())}`));
  console.log(chalk.white(`AI is playing as ${chalk.bold(aiColor.toUpperCase())}\n`));

  await sleep(2000);

  while (!game.isGameOver()) {
    const currentTurn = game.getTurn();

    if (currentTurn === playerColor) {
      displayGameState(game, undefined, 'Your turn! Make your move.');

      const validMoves = game.getValidMoves();
      const move = await promptForMove(validMoves);

      const result = game.executeMove(move);
      if (!result.success) {
        console.log(chalk.red(`Error: ${result.error}`));
        continue;
      }

      console.log(chalk.green(`\n✓ You played: ${move}`));
      await sleep(1000);
    } else {
      displayGameState(game, undefined, 'AI is thinking...');

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
        let workingMemory = '';
        try {
          const memory = await aiMemory.getWorkingMemory({
            resourceId: game.getGameId(),
            threadId: `game-${game.getGameId()}`
          });
          workingMemory = memory || '';
        } catch (err) {
          logError('Working Memory Retrieval', err);
        }

        logInfo(`AI response received. Text length: ${responseText.length}, Memory length: ${workingMemory.length}`);

        displayGameState(game, workingMemory, 'AI made a move');

        const move = extractMoveFromResponse(responseText);

        if (!move) {
          logError('Move Extraction Failed', new Error(`No valid move found in response: ${responseText.substring(0, 200)}`));
          console.log(chalk.red('AI failed to provide a valid move. Selecting random move...'));
          const validMoves = game.getValidMoves();
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.executeMove(randomMove);
          console.log(chalk.yellow(`AI played: ${randomMove}`));
          logInfo(`Fallback move selected: ${randomMove}`);
        } else {
          const result = game.executeMove(move);
          if (!result.success) {
            logError('Invalid Move', new Error(`AI attempted invalid move: ${move}. Error: ${result.error}`));
            console.log(chalk.red(`AI's move "${move}" was invalid. Selecting random move...`));
            const validMoves = game.getValidMoves();
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            game.executeMove(randomMove);
            console.log(chalk.yellow(`AI played: ${randomMove}`));
            logInfo(`Fallback move selected: ${randomMove}`);
          } else {
            console.log(chalk.cyan(`\n✓ AI played: ${move}`));
            logInfo(`AI successfully played: ${move}`);
          }
        }

        await sleep(2000);
      } catch (error) {
        logError('AI Turn Error', error);
        console.log(chalk.red(`Error during AI turn - check chess-errors.log for details`));
        console.log(chalk.gray(`Brief: ${(error as Error).message}`));
        const validMoves = game.getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.executeMove(randomMove);
        console.log(chalk.yellow(`AI played (fallback): ${randomMove}`));
        logInfo(`Fallback move after error: ${randomMove}`);
        await sleep(3000); // Give user more time to see the error
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
  console.log(chalk.green(`Game saved to: ${savedPath}\n`));

  gameState.clearGame();
}

export async function aiVsAIGame(): Promise<void> {
  const game = new GameEngine();
  gameState.setGame(game);

  const { agent: whiteAgent, memory: whiteMemory } = createChessAgent('White-AI');
  const { agent: blackAgent, memory: blackMemory } = createChessAgent('Black-AI');

  logInfo('Starting AI vs AI game');

  console.log(chalk.bold.green(`\n🤖 Starting AI vs AI game!`));
  console.log(chalk.white(`Watch two AI agents battle it out!\n`));

  await sleep(2000);

  while (!game.isGameOver()) {
    const currentTurn = game.getTurn();
    const currentAgent = currentTurn === 'white' ? whiteAgent : blackAgent;
    const currentMemory = currentTurn === 'white' ? whiteMemory : blackMemory;
    const currentColor = currentTurn;

    try {
      displayDualAgentState(
        game,
        undefined,
        undefined,
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
      } catch (err) {
        logError(`${currentColor} Working Memory Retrieval`, err);
      }

      logInfo(`AI (${currentColor}) response received. Text length: ${responseText.length}, Memory length: ${workingMemory.length}`);

      const move = extractMoveFromResponse(responseText);

      if (!move) {
        logError(`${currentColor} Move Extraction Failed`, new Error(`No valid move in response: ${responseText.substring(0, 200)}`));
        console.log(chalk.red(`${currentColor.toUpperCase()} AI failed to provide a valid move.`));
        const validMoves = game.getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.executeMove(randomMove);
        console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
        logInfo(`Fallback move: ${randomMove}`);
      } else {
        const result = game.executeMove(move);
        if (!result.success) {
          logError(`${currentColor} Invalid Move`, new Error(`Attempted: ${move}. Error: ${result.error}`));
          console.log(chalk.red(`${currentColor.toUpperCase()}'s move "${move}" was invalid.`));
          const validMoves = game.getValidMoves();
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.executeMove(randomMove);
          console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
          logInfo(`Fallback move: ${randomMove}`);
        } else {
          console.log(chalk.cyan(`\n✓ ${currentColor.toUpperCase()} played: ${move}`));
          logInfo(`AI (${currentColor}) successfully played: ${move}`);
        }
      }

      await sleep(3000);
    } catch (error) {
      logError(`${currentColor} AI Turn Error`, error);
      console.log(chalk.red(`Error during ${currentColor.toUpperCase()} AI turn - check chess-errors.log`));
      console.log(chalk.gray(`Brief: ${(error as Error).message}`));
      const validMoves = game.getValidMoves();
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      game.executeMove(randomMove);
      console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
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
  console.log(chalk.green(`Game saved to: ${savedPath}\n`));

  gameState.clearGame();
}
