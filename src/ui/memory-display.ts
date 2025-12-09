import chalk from 'chalk';

export function formatWorkingMemory(memoryContent: string): string {
  if (!memoryContent || memoryContent.trim() === '') {
    return chalk.gray('No working memory available yet...');
  }

  const lines = memoryContent.split('\n');
  let output = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      output += chalk.bold.cyan(line) + '\n';
    } else if (line.startsWith('## ')) {
      output += chalk.bold.yellow(line) + '\n';
    } else if (line.startsWith('### ')) {
      output += chalk.bold.green(line) + '\n';
    } else if (line.startsWith('- ')) {
      output += chalk.white(line) + '\n';
    } else if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex + 1);
      const value = line.substring(colonIndex + 1);
      output += chalk.gray(key) + chalk.white(value) + '\n';
    } else {
      output += line + '\n';
    }
  }

  return output;
}

export function extractWorkingMemorySummary(memoryContent: string): string {
  if (!memoryContent) return 'Analyzing position...';

  const lines = memoryContent.split('\n');
  const summary: string[] = [];

  let inPlanSection = false;
  for (const line of lines) {
    if (line.includes('Strategic Plan')) {
      inPlanSection = true;
    } else if (inPlanSection && line.startsWith('- ') && summary.length < 3) {
      summary.push(line.trim());
    } else if (line.startsWith('## ') && inPlanSection) {
      break;
    }
  }

  return summary.length > 0 ? summary.join('\n') : 'Thinking...';
}
