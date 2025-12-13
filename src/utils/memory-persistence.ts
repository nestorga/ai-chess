import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { logError, logInfo } from './error-logger.js';

const MEMORY_DIR = join(process.cwd(), 'memory-logs');

/**
 * Ensures the memory logs directory exists
 */
async function ensureMemoryDir(): Promise<void> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch (error) {
    logError('Memory Directory Creation', error);
    throw error;
  }
}

/**
 * Generates a filename for memory logs based on game ID and agent name
 */
function getMemoryFilename(gameId: string, agentName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return join(MEMORY_DIR, `${sanitizedName}_${gameId}_${timestamp}.txt`);
}

/**
 * Saves working memory to a text file
 *
 * @param gameId - The game identifier
 * @param agentName - The name of the agent whose memory is being saved
 * @param workingMemory - The working memory content to save
 * @param moveNumber - The current move number (optional)
 */
export async function saveWorkingMemory(
  gameId: string,
  agentName: string,
  workingMemory: string,
  moveNumber?: number
): Promise<void> {
  try {
    await ensureMemoryDir();

    const filename = getMemoryFilename(gameId, agentName);
    const timestamp = new Date().toISOString();
    const moveInfo = moveNumber !== undefined ? ` (Move ${moveNumber})` : '';

    const logEntry = `
================================================================================
Timestamp: ${timestamp}${moveInfo}
Agent: ${agentName}
Game ID: ${gameId}
================================================================================

${workingMemory}

`;

    // Append to file (creates if doesn't exist)
    await fs.appendFile(filename, logEntry, 'utf-8');

    logInfo(`Working memory saved: ${filename}`);
  } catch (error) {
    logError('Working Memory Save', error);
    // Don't throw - we don't want to crash the game if logging fails
  }
}

/**
 * Appends a summary entry to the memory log (e.g., game over)
 *
 * @param gameId - The game identifier
 * @param agentName - The name of the agent
 * @param summary - Summary text to append
 */
export async function appendMemorySummary(
  gameId: string,
  agentName: string,
  summary: string
): Promise<void> {
  try {
    await ensureMemoryDir();

    const filename = getMemoryFilename(gameId, agentName);
    const timestamp = new Date().toISOString();

    const summaryEntry = `
================================================================================
GAME SUMMARY
Timestamp: ${timestamp}
================================================================================

${summary}

`;

    await fs.appendFile(filename, summaryEntry, 'utf-8');

    logInfo(`Memory summary appended: ${filename}`);
  } catch (error) {
    logError('Memory Summary Append', error);
  }
}
