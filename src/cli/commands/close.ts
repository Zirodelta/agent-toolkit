/**
 * Close Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import { getToken, getBaseUrl } from '../config.js';
import { formatUsd, colorPnl, colorPercent, printError, printSuccess, printWarning } from '../utils.js';

export function registerCloseCommand(program: Command): void {
  program
    .command('close <execution_id>')
    .description('Close a running execution')
    .option('-f, --force', 'Skip confirmation')
    .option('--json', 'Output as JSON')
    .action(async (executionId: string, options) => {
      const token = getToken();
      if (!token) {
        printError('Authentication required. Set ZIRODELTA_TOKEN or run: zirodelta config set token <token>');
        process.exit(1);
      }

      if (!options.force) {
        printWarning(`About to close execution: ${executionId}`);
        console.log(chalk.gray('This will close both positions and realize PnL.'));
        console.log(chalk.gray('Use --force to skip this confirmation.\n'));
        
        // In a real CLI, we'd prompt for confirmation here
        // For now, require --force flag
        printError('Use --force flag to confirm closing');
        process.exit(1);
      }

      const spinner = ora('Closing execution...').start();

      try {
        const client = new ZirodeltaClient({
          baseUrl: getBaseUrl(),
          token,
        });

        const result = await client.closeExecution({
          execution_id: executionId,
        });

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (result.success) {
          printSuccess('Execution closed successfully!\n');
          console.log(chalk.bold('Final Results:'));
          console.log(`  Execution ID:  ${chalk.cyan(result.execution_id)}`);
          console.log(`  Final PnL:     ${colorPnl(result.final_pnl)}`);
          console.log(`  ROI:           ${colorPercent(result.final_roi_pct / 100)}`);
          console.log(`  Total Funding: ${formatUsd(result.total_funding)}`);
          console.log(`  Duration:      ${result.duration_hours.toFixed(1)} hours`);
          console.log();
        } else {
          printError(result.message || 'Failed to close execution');
        }
      } catch (error) {
        spinner.stop();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
