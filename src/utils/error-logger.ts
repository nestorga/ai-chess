import { appendFileSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'chess-errors.log');

export function logError(context: string, error: Error | unknown): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  const logEntry = `
[${timestamp}] ${context}
Error: ${errorMessage}
${errorStack ? `Stack: ${errorStack}` : ''}
${'='.repeat(80)}
`;

  try {
    appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    // Silently fail if we can't write to log file
    console.error('Failed to write to log file:', err);
  }
}

export function logInfo(message: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] INFO: ${message}\n`;

  try {
    appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    // Silently fail
  }
}
