import { Chess } from 'chess.js';
import type { GamePhase, PositionAnalysis, Color, MaterialCount, CastlingRights, MoveType } from '../types/chess-types.js';

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
  P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0
};

const CENTER_SQUARES = ['d4', 'd5', 'e4', 'e5'];
const EXTENDED_CENTER = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];

export class GameEngine {
  private chess: Chess;
  private gameId: string;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
    this.gameId = this.generateGameId();
  }

  private generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  getGameId(): string {
    return this.gameId;
  }

  getFEN(): string {
    return this.chess.fen();
  }

  getValidMoves(): string[] {
    return this.chess.moves();
  }

  getTurn(): 'white' | 'black' {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  getMoveNumber(): number {
    return this.chess.moveNumber();
  }

  executeMove(move: string): { success: boolean; error?: string; captured?: string } {
    try {
      const result = this.chess.move(move);
      if (result) {
        return {
          success: true,
          captured: result.captured
        };
      }
      return { success: false, error: 'Invalid move' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  isCheck(): boolean {
    return this.chess.isCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  getLastMove(): string | undefined {
    const history = this.chess.history();
    return history.length > 0 ? history[history.length - 1] : undefined;
  }

  getHistory(): string[] {
    return this.chess.history();
  }

  getPGN(): string {
    return this.chess.pgn();
  }

  setPGNHeader(key: string, value: string): void {
    this.chess.header(key, value);
  }

  loadPGN(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  getASCII(): string {
    return this.chess.ascii();
  }

  analyzePosition(): PositionAnalysis {
    const board = this.chess.board();

    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whiteCenterControl = 0;
    let blackCenterControl = 0;
    let whiteDevelopment = 0;
    let blackDevelopment = 0;

    board.forEach((row, rankIndex) => {
      row.forEach((square, fileIndex) => {
        if (square) {
          const piece = square.type;
          const isWhite = square.color === 'w';
          const squareName = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);

          const pieceValue = PIECE_VALUES[isWhite ? piece.toUpperCase() : piece.toLowerCase()];
          if (isWhite) {
            whiteMaterial += pieceValue;
          } else {
            blackMaterial += pieceValue;
          }

          if (CENTER_SQUARES.includes(squareName)) {
            if (isWhite) whiteCenterControl += 2;
            else blackCenterControl += 2;
          } else if (EXTENDED_CENTER.includes(squareName)) {
            if (isWhite) whiteCenterControl += 1;
            else blackCenterControl += 1;
          }

          if (piece !== 'p' && piece !== 'k') {
            const isBackRank = isWhite ? rankIndex === 7 : rankIndex === 0;
            if (!isBackRank) {
              if (isWhite) whiteDevelopment += 1;
              else blackDevelopment += 1;
            }
          }
        }
      });
    });

    const materialBalance = whiteMaterial - blackMaterial;

    const kingSafety = this.evaluateKingSafety();

    const phase = this.detectGamePhase();

    const threats = this.detectThreats();

    return {
      materialBalance,
      centerControl: { white: whiteCenterControl, black: blackCenterControl },
      developmentScore: { white: whiteDevelopment, black: blackDevelopment },
      kingSafety,
      phase,
      threats
    };
  }

  private evaluateKingSafety(): { white: number; black: number } {
    let whiteSafety = 0;
    let blackSafety = 0;

    const board = this.chess.board();

    board.forEach((row, rankIndex) => {
      row.forEach((square) => {
        if (square && square.type === 'k') {
          const isWhite = square.color === 'w';
          const kingRank = isWhite ? 7 - rankIndex : rankIndex;

          if (kingRank <= 1) {
            if (isWhite) whiteSafety += 3;
            else blackSafety += 3;
          }
        }
      });
    });

    if (this.isCheck()) {
      if (this.chess.turn() === 'w') whiteSafety -= 5;
      else blackSafety -= 5;
    }

    return { white: whiteSafety, black: blackSafety };
  }

  private detectGamePhase(): GamePhase {
    const moveNumber = this.getMoveNumber();
    const analysis = this.countPieces();

    if (moveNumber <= 10) {
      return 'opening';
    }

    if (analysis.totalPieces <= 12 || (analysis.queens === 0 && analysis.totalPieces <= 16)) {
      return 'endgame';
    }

    return 'middlegame';
  }

  private countPieces(): { totalPieces: number; queens: number } {
    const board = this.chess.board();
    let totalPieces = 0;
    let queens = 0;

    board.forEach(row => {
      row.forEach(square => {
        if (square) {
          totalPieces++;
          if (square.type === 'q') queens++;
        }
      });
    });

    return { totalPieces, queens };
  }

  private detectThreats(): string[] {
    const threats: string[] = [];

    if (this.isCheck()) {
      threats.push(`${this.getTurn()} king is in check`);
    }

    const moves = this.chess.moves({ verbose: true });
    const capturingMoves = moves.filter(move => move.captured);

    if (capturingMoves.length > 0) {
      const highValueCaptures = capturingMoves.filter(move =>
        move.captured && PIECE_VALUES[move.captured] >= 3
      );
      if (highValueCaptures.length > 0) {
        threats.push(`${capturingMoves.length} capturing moves available (${highValueCaptures.length} high-value)`);
      }
    }

    return threats;
  }

  getWinner(): Color | 'draw' | null {
    if (!this.isGameOver()) return null;

    if (this.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black' : 'white';
    }

    return 'draw';
  }

  getGameOverReason(): string {
    if (this.isCheckmate()) return 'checkmate';
    if (this.isStalemate()) return 'stalemate';
    if (this.isThreefoldRepetition()) return 'threefold-repetition';
    if (this.isInsufficientMaterial()) return 'insufficient-material';
    if (this.isDraw()) return 'fifty-move-rule';
    return 'unknown';
  }

  reset(): void {
    this.chess.reset();
    this.gameId = this.generateGameId();
  }

  getMaterialCount(): MaterialCount {
    const board = this.chess.board();

    const white = { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, total: 0 };
    const black = { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, total: 0 };

    board.forEach(row => {
      row.forEach(square => {
        if (square) {
          const piece = square.type;
          const isWhite = square.color === 'w';
          const target = isWhite ? white : black;
          const pieceValue = PIECE_VALUES[piece];

          switch (piece) {
            case 'p': target.pawns++; break;
            case 'n': target.knights++; break;
            case 'b': target.bishops++; break;
            case 'r': target.rooks++; break;
            case 'q': target.queens++; break;
          }

          target.total += pieceValue;
        }
      });
    });

    return { white, black };
  }

  getCastlingRights(): CastlingRights {
    const fen = this.chess.fen();
    const castlingPart = fen.split(' ')[2];

    return {
      whiteKingside: castlingPart.includes('K'),
      whiteQueenside: castlingPart.includes('Q'),
      blackKingside: castlingPart.includes('k'),
      blackQueenside: castlingPart.includes('q')
    };
  }

  getEnPassantSquare(): string | null {
    const fen = this.chess.fen();
    const enPassantPart = fen.split(' ')[3];
    return enPassantPart === '-' ? null : enPassantPart;
  }

  categorizeMove(move: string, wasCheck: boolean, wasCheckmate: boolean, wasCaptured: boolean): MoveType {
    if (wasCheckmate) return 'checkmate';
    if (move === 'O-O' || move === 'O-O-O') return 'castling';
    if (wasCaptured) return 'capture';
    if (wasCheck) return 'check';
    return 'quiet';
  }
}
