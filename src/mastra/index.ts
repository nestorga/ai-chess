import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { createChessAgent } from './agents/chess-agent.js';

export const mastra = new Mastra({
  agents: {
    chessAgent: createChessAgent('ChessAgent', 'haiku').agent
  },
  storage: new LibSQLStore({
    url: 'file:../chess-memory.db'
  }),
  logger: new PinoLogger({
    name: 'ChessAgent',
    level: 'info'
  }),
  observability: {
    default: { enabled: true }
  }
});
