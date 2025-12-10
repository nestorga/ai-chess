import chalk from 'chalk';

const PIECES: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

export function renderBoard(fen: string, lastMove?: string): string {
  const parts = fen.split(' ');
  const position = parts[0];
  const ranks = position.split('/');

  let output = '\n';

  output += '  a  b  c  d  e  f  g  h\n';
  output += '┌──┬──┬──┬──┬──┬──┬──┬──┐\n';

  ranks.forEach((rank, rankIndex) => {
    const rankNumber = 8 - rankIndex;
    output += `${rankNumber} │`;

    let fileIndex = 0;
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        const emptySquares = parseInt(char);
        for (let i = 0; i < emptySquares; i++) {
          output += '  │';
          fileIndex++;
        }
      } else {
        const piece = PIECES[char] || char;
        output += ` ${piece}│`;
        fileIndex++;
      }
    }

    output += ` ${rankNumber}\n`;

    if (rankIndex < 7) {
      output += '├──┼──┼──┼──┼──┼──┼──┼──┤\n';
    }
  });

  output += '└──┴──┴──┴──┴──┴──┴──┴──┘\n';
  output += '  a  b  c  d  e  f  g  h\n';

  if (lastMove) {
    output += `\nLast move: ${lastMove}\n`;
  }

  return output;
}

export function renderSimpleBoard(ascii: string): string {
  return '\n' + ascii + '\n';
}
