import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from './game-engine.js';
import type { GameResult } from '../types/chess-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DIR = path.join(__dirname, '../../games');

async function ensureGamesDirectory(): Promise<void> {
  try {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create games directory:', error);
  }
}

export async function saveGame(
  gameEngine: GameEngine,
  result: GameResult,
  whitePlayer: string,
  blackPlayer: string,
  mode: string
): Promise<string> {
  await ensureGamesDirectory();

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `chess-game-${timestamp}.pgn`;
  const filepath = path.join(GAMES_DIR, filename);

  gameEngine.setPGNHeader('Event', 'AI Chess Match');
  gameEngine.setPGNHeader('Site', 'CLI');
  gameEngine.setPGNHeader('Date', new Date().toISOString().split('T')[0].replace(/-/g, '.'));
  gameEngine.setPGNHeader('Round', '1');
  gameEngine.setPGNHeader('White', whitePlayer);
  gameEngine.setPGNHeader('Black', blackPlayer);
  gameEngine.setPGNHeader('Mode', mode);
  gameEngine.setPGNHeader('Model', 'claude-haiku-4-5-20251001');

  let resultString = '1/2-1/2';
  if (result.winner === 'white') resultString = '1-0';
  else if (result.winner === 'black') resultString = '0-1';

  gameEngine.setPGNHeader('Result', resultString);

  const pgn = gameEngine.getPGN();

  await fs.writeFile(filepath, pgn, 'utf-8');

  return filepath;
}

export async function loadGame(filepath: string): Promise<GameEngine> {
  const pgn = await fs.readFile(filepath, 'utf-8');
  const gameEngine = new GameEngine();

  const success = gameEngine.loadPGN(pgn);
  if (!success) {
    throw new Error('Failed to load PGN file');
  }

  return gameEngine;
}

export async function listSavedGames(): Promise<string[]> {
  await ensureGamesDirectory();

  try {
    const files = await fs.readdir(GAMES_DIR);
    return files
      .filter(f => f.endsWith('.pgn'))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function getGamePath(filename: string): Promise<string> {
  return path.join(GAMES_DIR, filename);
}
