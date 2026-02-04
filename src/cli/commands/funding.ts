/**
 * Funding Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import { getToken, getBaseUrl } from '../config.js';
import { formatUsd, colorPnl, printError } from '../utils.js';

export function registerFundingCommand(program: Command): void {
  program
    .command('funding')
    .description('View funding fees breakdown')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const token = getToken();
      if (!token) {
        printError('Authentication required. Set ZIRODELTA_TOKEN or run: zirodelta config set token <token>');
        process.exit(1);
      }

      const spinner = ora('Fetching funding fees...').start();

      try {
        const client = new ZirodeltaClient({
          baseUrl: getBaseUrl(),
          token,
        });

        const fees = await client.getFundingFees();

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(fees, null, 2));
          return;
        }

        console.log(chalk.bold('\n💰 Funding Fees Summary\n'));
        
        console.log(chalk.bold('  Total'));
        console.log(`    Received:  ${chalk.green(formatUsd(fees.total_received))}`);
        console.log(`    Paid:      ${chalk.red(formatUsd(fees.total_paid))}`);
        console.log(`    Net:       ${colorPnl(fees.total_funding_fee)}`);

        console.log(chalk.bold('\n  Closed Positions'));
        console.log(`    Received:  ${chalk.green(formatUsd(fees.breakdown.closed.received))}`);
        console.log(`    Paid:      ${chalk.red(formatUsd(fees.breakdown.closed.paid))}`);
        console.log(`    Net:       ${colorPnl(fees.breakdown.closed.net)}`);

        console.log(chalk.bold('\n  Running Positions'));
        console.log(`    Received:  ${chalk.green(formatUsd(fees.breakdown.running.received))}`);
        console.log(`    Paid:      ${chalk.red(formatUsd(fees.breakdown.running.paid))}`);
        console.log(`    Net:       ${colorPnl(fees.breakdown.running.net)}`);

        console.log();
      } catch (error) {
        spinner.stop();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
