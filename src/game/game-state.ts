import { GameEngine } from './game-engine.js';

class GameStateManager {
  private currentGame: GameEngine | null = null;

  setGame(game: GameEngine): void {
    this.currentGame = game;
  }

  getGame(): GameEngine {
    if (!this.currentGame) {
      throw new Error('No active game. Please initialize a game first.');
    }
    return this.currentGame;
  }

  hasGame(): boolean {
    return this.currentGame !== null;
  }

  clearGame(): void {
    this.currentGame = null;
  }
}

export const gameState = new GameStateManager();
