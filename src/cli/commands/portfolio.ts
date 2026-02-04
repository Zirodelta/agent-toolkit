/**
 * Portfolio Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import { getToken, getBaseUrl } from '../config.js';
import { createTable, formatUsd, colorPnl, colorPercent, printError } from '../utils.js';

export function registerPortfolioCommand(program: Command): void {
  program
    .command('portfolio')
    .alias('pf')
    .description('View live portfolio and positions')
    .option('-e, --execution <id>', 'Filter by execution ID')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const token = getToken();
      if (!token) {
        printError('Authentication required. Set ZIRODELTA_TOKEN or run: zirodelta config set token <token>');
        process.exit(1);
      }

      const spinner = ora('Fetching portfolio...').start();

      try {
        const client = new ZirodeltaClient({
          baseUrl: getBaseUrl(),
          token,
        });

        const portfolio = await client.getPortfolio({
          execution_id: options.execution,
        });

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(portfolio, null, 2));
          return;
        }

        const { executions, summary } = portfolio;

        if (executions.length === 0) {
          console.log(chalk.yellow('\nNo active positions\n'));
          console.log(chalk.gray('Run `zirodelta opportunities` to find arbitrage opportunities'));
          return;
        }

        // Summary
        console.log(chalk.bold('\n📊 Portfolio Summary\n'));
        console.log(`  Active Executions: ${chalk.cyan(summary.running_executions)}`);
        console.log(`  Total Invested:    ${formatUsd(summary.total_invested)}`);
        console.log(`  Unrealized PnL:    ${colorPnl(summary.total_unrealized_pnl)}`);
        console.log(`  Realized PnL:      ${colorPnl(summary.total_realized_pnl)}`);
        console.log(`  Funding Received:  ${chalk.green(formatUsd(summary.total_funding_received))}`);
        console.log(`  Funding Paid:      ${chalk.red(formatUsd(summary.total_funding_paid))}`);
        console.log(`  Weighted ROI:      ${colorPercent(summary.weighted_roi / 100)}`);

        // Positions table
        console.log(chalk.bold('\n📈 Active Positions\n'));

        const table = createTable([
          'Symbol',
          'Status',
          'Invested',
          'PnL',
          'ROI',
          'Funding',
          'ID',
        ]);

        for (const exec of executions) {
          const { execution, pnl, funding } = exec;
          
          const statusColor = 
            execution.status === 'running' ? chalk.green :
            execution.status === 'closing' ? chalk.yellow :
            execution.status === 'queued' ? chalk.blue :
            chalk.gray;

          table.push([
            chalk.bold(execution.symbol),
            statusColor(execution.status),
            formatUsd(execution.input_amount),
            colorPnl(pnl.total_pnl),
            colorPercent(pnl.total_pnl_pct / 100),
            colorPnl(funding.net_funding),
            chalk.gray(execution.id.slice(0, 8)),
          ]);
        }

        console.log(table.toString());
        console.log();
      } catch (error) {
        spinner.stop();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
