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

  output += '    a  b  c  d  e  f  g  h\n';
  output += '  ┌──┬──┬──┬──┬──┬──┬──┬──┐\n';

  ranks.forEach((rank, rankIndex) => {
    const rankNumber = 8 - rankIndex;
    output += `${rankNumber} │`;

    let fileIndex = 0;
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        const emptySquares = parseInt(char);
        for (let i = 0; i < emptySquares; i++) {
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          const bgColor = isLight ? chalk.bgWhite : chalk.bgBlackBright;
          output += bgColor('  ') + '│';
          fileIndex++;
        }
      } else {
        const piece = PIECES[char] || char;
        const isLight = (rankIndex + fileIndex) % 2 === 0;
        const isWhitePiece = char === char.toUpperCase();

        let cell;
        if (isLight) {
          cell = isWhitePiece
            ? chalk.bgWhite.black(` ${piece}`)
            : chalk.bgWhite.red(` ${piece}`);
        } else {
          cell = isWhitePiece
            ? chalk.bgBlackBright.white(` ${piece}`)
            : chalk.bgBlackBright.red(` ${piece}`);
        }

        output += cell + '│';
        fileIndex++;
      }
    }

    output += ` ${rankNumber}\n`;

    if (rankIndex < 7) {
      output += '  ├──┼──┼──┼──┼──┼──┼──┼──┤\n';
    }
  });

  output += '  └──┴──┴──┴──┴──┴──┴──┴──┘\n';
  output += '    a  b  c  d  e  f  g  h\n';

  if (lastMove) {
    output += chalk.gray(`\n  Last move: ${lastMove}\n`);
  }

  return output;
}

export function renderSimpleBoard(ascii: string): string {
  return '\n' + ascii + '\n';
}
