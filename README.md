# AI Chess Agent

An intelligent chess-playing AI agent powered by Claude Haiku 4.5 with strategic working memory capabilities. Watch the AI think strategically, learn opponent patterns, and adapt its gameplay in real-time!

## Features

- **Strategic AI Agent**: Powered by Claude Haiku 4.5 with sophisticated chess knowledge
- **Working Memory**: AI maintains strategic understanding of the game, opponent analysis, and adapts its play style
- **Two Game Modes**:
  - **Human vs AI**: Play against the AI agent
  - **AI vs AI**: Watch two AI agents battle each other
- **Beautiful CLI Interface**: Unicode chess pieces and colored board display
- **Game Persistence**: Save and load games in standard PGN format
- **Position Analysis**: Real-time evaluation of material, center control, king safety, and more
- **Move Validation**: All moves are validated using the chess.js library

## Installation

1. Clone this repository:
   ```bash
   cd ai-chess
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   - Copy the `.env` file and add your Anthropic API key:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

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

### List Saved Games

View all saved games:
```bash
npm run list
```

### Load a Saved Game

View a previously played game:
```bash
npm run play -- load <filename>
```

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
   - Unicode chess board rendering with colored squares
   - Working memory display showing AI's strategic thinking
   - Game state visualization

6. **Game Loop** ([src/game/game-loop.ts](src/game/game-loop.ts))
   - Orchestrates turns between players and AI
   - Handles both Human vs AI and AI vs AI modes
   - Manages game flow and error handling

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
- **CLI**: Commander.js, Chalk, readline
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
│   │   ├── game-state.ts    # Global game state
│   │   └── game-persistence.ts  # Save/load games
│   ├── ui/
│   │   ├── board-renderer.ts    # Chess board display
│   │   ├── memory-display.ts    # Working memory formatting
│   │   └── cli-layout.ts        # Terminal UI layout
│   ├── types/
│   │   └── chess-types.ts   # TypeScript type definitions
│   └── index.ts             # CLI entry point
├── games/                   # Saved PGN files
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

```bash
$ npm run play

🎮 Starting Human vs AI game!
You are playing as WHITE
AI is playing as BLACK

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

Your move?
> e4
```

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
