export type Color = 'white' | 'black';
export type GameMode = 'human-ai' | 'ai-ai';
export type GamePhase = 'opening' | 'middlegame' | 'endgame';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PlayingStyle = 'aggressive' | 'defensive' | 'positional' | 'tactical' | 'balanced';

export interface GameResult {
  winner: Color | 'draw';
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'draw-agreement' | 'insufficient-material' | 'threefold-repetition' | 'fifty-move-rule';
  moveCount: number;
  pgn: string;
}

export interface PositionAnalysis {
  materialBalance: number;
  centerControl: { white: number; black: number };
  developmentScore: { white: number; black: number };
  kingSafety: { white: number; black: number };
  phase: GamePhase;
  threats: string[];
}

export interface BoardState {
  fen: string;
  turn: 'w' | 'b';
  moveNumber: number;
  ascii: string;
  lastMove?: string;
}

export interface MoveResult {
  success: boolean;
  fen: string;
  capturedPiece?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  error?: string;
}

export interface ValidMoves {
  moves: string[];
  count: number;
  inCheck: boolean;
}
