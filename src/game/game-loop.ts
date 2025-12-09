import readline from 'readline';
import chalk from 'chalk';
import { GameEngine } from './game-engine.js';
import { gameState } from './game-state.js';
import { saveGame } from './game-persistence.js';
import { createChessAgent } from '../mastra/agents/chess-agent.js';
import { displayGameState, displayDualAgentState, displayGameOver } from '../ui/cli-layout.js';
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
  const aiAgent = createChessAgent(`AI-${aiColor.charAt(0).toUpperCase() + aiColor.slice(1)}`);

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
        const response = await aiAgent.generate(
          `It's your turn to move. You are playing as ${aiColor}. Analyze the position and make your move.`,
          {
            resourceId: game.getGameId(),
            threadId: `game-${game.getGameId()}`
          }
        );

        const workingMemory = response.workingMemory || '';
        const responseText = response.text || '';

        displayGameState(game, workingMemory, 'AI is thinking...');

        const move = extractMoveFromResponse(responseText);

        if (!move) {
          console.log(chalk.red('AI failed to provide a valid move. Selecting random move...'));
          const validMoves = game.getValidMoves();
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.executeMove(randomMove);
          console.log(chalk.yellow(`AI played: ${randomMove}`));
        } else {
          const result = game.executeMove(move);
          if (!result.success) {
            console.log(chalk.red(`AI's move "${move}" was invalid. Selecting random move...`));
            const validMoves = game.getValidMoves();
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            game.executeMove(randomMove);
            console.log(chalk.yellow(`AI played: ${randomMove}`));
          } else {
            console.log(chalk.cyan(`\n✓ AI played: ${move}`));
          }
        }

        await sleep(2000);
      } catch (error) {
        console.log(chalk.red(`Error during AI turn: ${(error as Error).message}`));
        const validMoves = game.getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.executeMove(randomMove);
        console.log(chalk.yellow(`AI played (fallback): ${randomMove}`));
        await sleep(2000);
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

  const whiteAgent = createChessAgent('White-AI');
  const blackAgent = createChessAgent('Black-AI');

  console.log(chalk.bold.green(`\n🤖 Starting AI vs AI game!`));
  console.log(chalk.white(`Watch two AI agents battle it out!\n`));

  await sleep(2000);

  while (!game.isGameOver()) {
    const currentTurn = game.getTurn();
    const currentAgent = currentTurn === 'white' ? whiteAgent : blackAgent;
    const currentColor = currentTurn;

    try {
      displayDualAgentState(
        game,
        undefined,
        undefined,
        `${currentColor.toUpperCase()} AI is thinking...`
      );

      const response = await currentAgent.generate(
        `It's your turn to move. You are playing as ${currentColor}. Analyze the position and make your move.`,
        {
          resourceId: game.getGameId(),
          threadId: `${currentColor}-thread`
        }
      );

      const workingMemory = response.workingMemory || '';
      const responseText = response.text || '';

      const move = extractMoveFromResponse(responseText);

      if (!move) {
        console.log(chalk.red(`${currentColor.toUpperCase()} AI failed to provide a valid move.`));
        const validMoves = game.getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        game.executeMove(randomMove);
        console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
      } else {
        const result = game.executeMove(move);
        if (!result.success) {
          console.log(chalk.red(`${currentColor.toUpperCase()}'s move "${move}" was invalid.`));
          const validMoves = game.getValidMoves();
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          game.executeMove(randomMove);
          console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
        } else {
          console.log(chalk.cyan(`\n✓ ${currentColor.toUpperCase()} played: ${move}`));
        }
      }

      await sleep(3000);
    } catch (error) {
      console.log(chalk.red(`Error during ${currentColor.toUpperCase()} AI turn: ${(error as Error).message}`));
      const validMoves = game.getValidMoves();
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      game.executeMove(randomMove);
      console.log(chalk.yellow(`${currentColor.toUpperCase()} played (fallback): ${randomMove}`));
      await sleep(2000);
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
