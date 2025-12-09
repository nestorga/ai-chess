import { createTool } from '@mastra/core';
import { z } from 'zod';
import { gameState } from '../../game/game-state.js';

export const analyzePosition = createTool({
  id: 'analyze-position',
  description: 'Get strategic analysis of the current board position including material balance, center control, piece development, king safety, game phase, and threats. Use this to evaluate the position before making strategic decisions.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    materialBalance: z.number().describe('Material advantage in pawns (positive = white ahead, negative = black ahead)'),
    centerControl: z.object({
      white: z.number().describe('White\'s center control score'),
      black: z.number().describe('Black\'s center control score')
    }),
    developmentScore: z.object({
      white: z.number().describe('Number of developed pieces for white'),
      black: z.number().describe('Number of developed pieces for black')
    }),
    kingSafety: z.object({
      white: z.number().describe('King safety score for white (higher = safer)'),
      black: z.number().describe('King safety score for black (higher = safer)')
    }),
    phase: z.enum(['opening', 'middlegame', 'endgame']).describe('Current phase of the game'),
    threats: z.array(z.string()).describe('List of immediate threats in the position')
  }),
  execute: async () => {
    const game = gameState.getGame();
    const analysis = game.analyzePosition();

    return analysis;
  }
});
