/**
 * TUI Command - Launch the terminal dashboard
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runTUI } from '../../tui/index.js';

export function registerTuiCommand(program: Command): void {
  program
    .command('tui')
    .description('Launch the real-time terminal dashboard')
    .option('-i, --interval <seconds>', 'Refresh interval in seconds', '30')
    .action(async (options) => {
      try {
        console.log(chalk.cyan('🚀 Starting Zirodelta TUI Dashboard...'));
        console.log(chalk.gray('Press q to quit, r to refresh, p to change pair'));
        console.log('');

        await runTUI({
          interval: parseInt(options.interval, 10),
        });
      } catch (err) {
        console.error(chalk.red('Failed to start TUI:'), err);
        process.exit(1);
      }
    });
}
