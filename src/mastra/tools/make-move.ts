import { createTool } from '@mastra/core';
import { z } from 'zod';
import { gameState } from '../../game/game-state.js';

export const makeMove = createTool({
  id: 'make-move',
  description: 'Execute a chess move in Standard Algebraic Notation (SAN). Examples: "e4", "Nf3", "O-O" (castling), "exd5" (capture). This is how you make your move in the game.',
  inputSchema: z.object({
    move: z.string().describe('The move to make in SAN notation (e.g., "e4", "Nf3", "O-O")')
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the move was executed successfully'),
    fen: z.string().describe('The board position after the move in FEN notation'),
    capturedPiece: z.string().optional().describe('The piece that was captured, if any'),
    isCheck: z.boolean().describe('Whether the opponent is now in check'),
    isCheckmate: z.boolean().describe('Whether the move resulted in checkmate'),
    isStalemate: z.boolean().describe('Whether the move resulted in stalemate'),
    isDraw: z.boolean().describe('Whether the game is now a draw'),
    error: z.string().optional().describe('Error message if the move failed')
  }),
  execute: async ({ context }) => {
    const { move } = context;
    const game = gameState.getGame();

    const result = game.executeMove(move);

    if (!result.success) {
      return {
        success: false,
        fen: game.getFEN(),
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        error: result.error || 'Invalid move'
      };
    }

    return {
      success: true,
      fen: game.getFEN(),
      capturedPiece: result.captured,
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isDraw: game.isDraw()
    };
  }
});
