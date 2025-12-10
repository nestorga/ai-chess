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
    inCheck: z.boolean().describe('Whether the current player is in check'),
    movesByType: z.object({
      captures: z.array(z.string()).describe('Moves that capture opponent pieces'),
      checks: z.array(z.string()).describe('Moves that give check to the opponent'),
      castling: z.array(z.string()).describe('Castling moves (O-O, O-O-O)'),
      developing: z.array(z.string()).describe('Moves that develop pieces from back rank'),
      quiet: z.array(z.string()).describe('Non-capturing, non-checking moves')
    }).describe('Moves categorized by type')
  }),
  execute: async () => {
    const game = gameState.getGame();
    const moves = game.getValidMoves();
    const inCheck = game.isCheck();

    // Categorize moves using chess.js verbose moves
    const verboseMoves = (game as any).chess.moves({ verbose: true });
    const currentTurn = game.getTurn();
    const backRank = currentTurn === 'white' ? '1' : '8';

    const captures: string[] = [];
    const checks: string[] = [];
    const castling: string[] = [];
    const developing: string[] = [];
    const quiet: string[] = [];

    verboseMoves.forEach((move: any) => {
      const san = move.san;

      // Check if it's castling
      if (move.flags.includes('k') || move.flags.includes('q')) {
        castling.push(san);
        return;
      }

      // Check if it's a capture
      if (move.captured) {
        captures.push(san);
      }

      // Test if the move gives check by making it temporarily
      const testGame = new (game as any).chess.constructor((game as any).chess.fen());
      testGame.move(move);
      if (testGame.isCheck()) {
        checks.push(san);
      }

      // Check if it's a developing move (piece moving off back rank, not a pawn or king)
      if (move.piece !== 'p' && move.piece !== 'k' && move.from[1] === backRank) {
        developing.push(san);
      }

      // If it's not a capture, check, castling, or developing move, it's quiet
      if (!move.captured && !checks.includes(san) && !castling.includes(san) && !developing.includes(san)) {
        quiet.push(san);
      }
    });

    return {
      moves,
      count: moves.length,
      inCheck,
      movesByType: {
        captures,
        checks,
        castling,
        developing,
        quiet
      }
    };
  }
});
