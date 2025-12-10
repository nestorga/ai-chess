import { createTool } from '@mastra/core';
import { z } from 'zod';
import { gameState } from '../../game/game-state.js';

export const getBoardState = createTool({
  id: 'get-board-state',
  description: 'Get the current board state including FEN notation, whose turn it is, move number, and the last move played. Use this to understand the current game situation.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    fen: z.string().describe('Current position in FEN notation'),
    turn: z.enum(['w', 'b']).describe('Whose turn it is (w=white, b=black)'),
    moveNumber: z.number().describe('Current move number'),
    ascii: z.string().describe('ASCII representation of the board'),
    lastMove: z.string().optional().describe('The last move played in SAN notation'),
    material: z.object({
      white: z.object({
        pawns: z.number(),
        knights: z.number(),
        bishops: z.number(),
        rooks: z.number(),
        queens: z.number(),
        total: z.number()
      }),
      black: z.object({
        pawns: z.number(),
        knights: z.number(),
        bishops: z.number(),
        rooks: z.number(),
        queens: z.number(),
        total: z.number()
      })
    }).describe('Material count and total value for each side'),
    castlingRights: z.object({
      whiteKingside: z.boolean(),
      whiteQueenside: z.boolean(),
      blackKingside: z.boolean(),
      blackQueenside: z.boolean()
    }).describe('Available castling rights for each side'),
    enPassantSquare: z.string().nullable().describe('En passant target square if available')
  }),
  execute: async () => {
    const game = gameState.getGame();

    return {
      fen: game.getFEN(),
      turn: game.getTurn() === 'white' ? 'w' as const : 'b' as const,
      moveNumber: game.getMoveNumber(),
      ascii: game.getASCII(),
      lastMove: game.getLastMove(),
      material: game.getMaterialCount(),
      castlingRights: game.getCastlingRights(),
      enPassantSquare: game.getEnPassantSquare()
    };
  }
});
