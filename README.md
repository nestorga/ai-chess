# AI Chess Agent

An intelligent chess-playing AI agent powered by Claude Haiku 4.5 with strategic working memory capabilities. Watch the AI think strategically, learn opponent patterns, and adapt its gameplay in real-time!

## Features

- **Strategic AI Agent**: Powered by Claude Haiku 4.5 with sophisticated chess knowledge
- **Working Memory**: AI maintains strategic understanding of the game, opponent analysis, and adapts its play style
- **Two Game Modes**:
  - **Human vs AI**: Play against the AI agent
  - **AI vs AI**: Watch two AI agents battle each other
- **Clean CLI Interface**: Unicode chess pieces with terminal-based UI
- **Position Analysis**: Real-time evaluation of material, center control, king safety, and more
- **Move Validation**: All moves are validated using the chess.js library

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd ai-chess
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   - Create a `.env` file in the project root and add your Anthropic API key:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```
   - **Important**: The `.env` file is automatically loaded when you use the npm scripts (`npm run play`, etc.)

## Usage

### Play Against the AI

Play as white:
```bash
npm run play
```

Play as black:
```bash
npm run play -- --color black
```

### Watch AI vs AI

Watch two AI agents play against each other:
```bash
npm run play:ai-vs-ai
```

Or use the full command:
```bash
npm run play -- --mode ai-ai
```

### Debugging and Error Logs

If you encounter errors during gameplay, check the `chess-errors.log` file in the project root directory. This file contains detailed error information including:
- Timestamps for each error
- Full error messages and stack traces
- Context about what operation was being performed
- AI move generation details

The log file is automatically created when errors occur and can help diagnose issues with API keys, network connectivity, or game logic problems.

## How It Works

### Architecture

The project is structured into several key layers:

1. **Game Engine** ([src/game/game-engine.ts](src/game/game-engine.ts))
   - Wraps chess.js for move validation and game rules
   - Provides position analysis (material, center control, king safety)
   - Detects game phase (opening, middlegame, endgame)

2. **Mastra Tools** ([src/mastra/tools/](src/mastra/tools/))
   - `get-valid-moves`: Returns all legal moves
   - `make-move`: Executes a chess move
   - `analyze-position`: Evaluates strategic factors
   - `get-board-state`: Returns current position info
   - `get-game-history`: Retrieves move history

3. **Chess Agent** ([src/mastra/agents/chess-agent.ts](src/mastra/agents/chess-agent.ts))
   - Uses Claude Haiku 4.5 for cost-efficient gameplay
   - Comprehensive chess instructions covering opening, middlegame, and endgame
   - Working memory tracks opponent patterns and strategic assessment
   - Equipped with all chess tools for informed decision-making

4. **Working Memory** ([src/mastra/memory/working-memory-template.ts](src/mastra/memory/working-memory-template.ts))
   - Tracks game phase and position evaluation
   - Models opponent's skill level and playing style
   - Maintains strategic plan and identifies patterns
   - Records critical moments and learning insights

5. **UI Layer** ([src/ui/](src/ui/))
   - Unicode chess board rendering with box-drawing characters
   - Scrollable working memory display showing AI's strategic thinking
   - Three-panel terminal layout with board, status, and memory sections

6. **Game Loop** ([src/game/game-loop.ts](src/game/game-loop.ts))
   - Orchestrates turns between players and AI
   - Handles both Human vs AI and AI vs AI modes
   - Manages game flow and error handling
   - Persists AI working memory after each turn

### The AI's Approach

The chess agent follows these principles:

**Opening (moves 1-10)**:
- Control the center
- Develop pieces efficiently
- Castle for king safety

**Middlegame (moves 11-30)**:
- Create and execute strategic plans
- Look for tactical opportunities
- Improve piece positions
- Create threats

**Endgame (moves 30+)**:
- Activate the king
- Push passed pawns
- Apply endgame knowledge

The agent uses its working memory to:
- Track opponent tendencies and weaknesses
- Maintain positional understanding
- Adapt strategy based on the game flow
- Learn from critical moments

## Technical Stack

- **AI Model**: Claude Haiku 4.5 (via Anthropic API)
- **Framework**: Mastra (for agent orchestration and memory)
- **Chess Engine**: chess.js (for move validation and rules)
- **CLI**: Commander.js, Blessed (TUI), Chalk
- **Database**: LibSQL (for persistent working memory)
- **Language**: TypeScript

## Project Structure

```
ai-chess/
├── src/
│   ├── mastra/
│   │   ├── agents/          # Chess agent definition
│   │   ├── tools/           # Chess-specific tools
│   │   ├── memory/          # Working memory template
│   │   └── index.ts         # Mastra configuration
│   ├── game/
│   │   ├── game-engine.ts   # Chess.js wrapper
│   │   ├── game-loop.ts     # Game orchestration
│   │   └── game-state.ts    # Global game state
│   ├── ui/
│   │   ├── board-renderer.ts    # Chess board display
│   │   ├── memory-display.ts    # Working memory formatting
│   │   └── cli-layout.ts        # Terminal UI layout
│   ├── types/
│   │   └── chess-types.ts   # TypeScript type definitions
│   ├── utils/
│   │   ├── error-logger.ts     # Error logging utilities
│   │   └── memory-persistence.ts  # Working memory persistence
│   └── index.ts             # CLI entry point
├── memory-logs/             # AI working memory logs
└── package.json
```

## Cost Efficiency

This project uses **Claude Haiku 4.5**, which is:
- 4-5x faster than Claude Sonnet
- Significantly cheaper per token
- Still highly capable for strategic chess play

A typical game costs only a few cents in API usage.

## Development

Build the project:
```bash
npm run build
```

Run in development mode:
```bash
npm run dev
```

## Examples

### Starting a Game

When you run `npm run play`, the game launches a full-screen terminal UI with three panels:

**Left side:**
- **Top panel**: Chess board with Unicode pieces and coordinates
- **Bottom panel**: Status messages, command help, and move input

**Right side:**
- **Memory panel**: Scrollable AI working memory showing strategic thinking

The chess board displays using Unicode pieces:
```
    a  b  c  d  e  f  g  h
  ┌──┬──┬──┬──┬──┬──┬──┬──┐
8 │♜ │♞ │♝ │♛ │♚ │♝ │♞ │♜ │ 8
  ├──┼──┼──┼──┼──┼──┼──┼──┤
7 │♟ │♟ │♟ │♟ │♟ │♟ │♟ │♟ │ 7
  ├──┼──┼──┼──┼──┼──┼──┼──┤
6 │  │  │  │  │  │  │  │  │ 6
  ├──┼──┼──┼──┼──┼──┼──┼──┤
5 │  │  │  │  │  │  │  │  │ 5
  ├──┼──┼──┼──┼──┼──┼──┼──┤
4 │  │  │  │  │  │  │  │  │ 4
  ├──┼──┼──┼──┼──┼──┼──┼──┤
3 │  │  │  │  │  │  │  │  │ 3
  ├──┼──┼──┼──┼──┼──┼──┼──┤
2 │♙ │♙ │♙ │♙ │♙ │♙ │♙ │♙ │ 2
  ├──┼──┼──┼──┼──┼──┼──┼──┤
1 │♖ │♘ │♗ │♕ │♔ │♗ │♘ │♖ │ 1
  └──┴──┴──┴──┴──┴──┴──┴──┘
    a  b  c  d  e  f  g  h
```

**Keyboard controls:**
- **Enter**: Submit your move (e.g., type `e4` and press Enter)
- **Tab**: Switch focus between panels (or switch between agents in AI vs AI mode)
- **↑↓**: Scroll through AI working memory
- **Ctrl+C**: Quit game (with confirmation)

## Future Enhancements

- Opening book integration for stronger early game
- Endgame tablebase support
- Move time controls
- Difficulty levels
- Tournament mode with ELO ratings
- Post-game analysis with annotations
- Web-based UI option

## Credits

Created for the AI Bootcamp Hackathon using the Mastra framework.

## License

MIT
