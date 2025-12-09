import { createTool } from '@mastra/core';
import { z } from 'zod';
import { gameState } from '../../game/game-state.js';

export const getGameHistory = createTool({
  id: 'get-game-history',
  description: 'Retrieve the complete move history of the game in Standard Algebraic Notation or PGN format. Use this to review what moves have been played so far.',
  inputSchema: z.object({
    format: z.enum(['san', 'pgn']).optional().default('san').describe('Format for the history (san=array of moves, pgn=full game notation)')
  }),
  outputSchema: z.object({
    moves: z.array(z.string()).describe('Array of moves in SAN notation'),
    pgn: z.string().describe('Full game in PGN format'),
    moveCount: z.number().describe('Total number of moves played')
  }),
  execute: async ({ context }) => {
    const game = gameState.getGame();
    const moves = game.getHistory();
    const pgn = game.getPGN();

    return {
      moves,
      pgn,
      moveCount: moves.length
    };
  }
});
