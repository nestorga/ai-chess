import { createTool } from '@mastra/core';
import { z } from 'zod';
import { gameState } from '../../game/game-state.js';

export const getValidMoves = createTool({
  id: 'get-valid-moves',
  description: 'Get all legal moves for the current position in algebraic notation (SAN). Use this to see what moves are available before making your move.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    moves: z.array(z.string()).describe('Array of legal moves in Standard Algebraic Notation'),
    count: z.number().describe('Total number of legal moves available'),
    inCheck: z.boolean().describe('Whether the current player is in check')
  }),
  execute: async () => {
    const game = gameState.getGame();
    const moves = game.getValidMoves();
    const inCheck = game.isCheck();

    return {
      moves,
      count: moves.length,
      inCheck
    };
  }
});
