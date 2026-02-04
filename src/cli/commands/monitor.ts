/**
 * Monitor Command - Simple polling-based monitoring
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import { getToken, getBaseUrl } from '../config.js';
import { formatUsd, colorPnl, colorPercent, printError, printInfo } from '../utils.js';

export function registerMonitorCommand(program: Command): void {
  program
    .command('monitor')
    .alias('watch')
    .description('Monitor portfolio in real-time')
    .option('-i, --interval <seconds>', 'Refresh interval', '30')
    .option('-e, --execution <id>', 'Monitor specific execution')
    .action(async (options) => {
      const token = getToken();
      if (!token) {
        printError('Authentication required. Set ZIRODELTA_TOKEN or run: zirodelta config set token <token>');
        process.exit(1);
      }

      const interval = parseInt(options.interval) * 1000;
      const client = new ZirodeltaClient({
        baseUrl: getBaseUrl(),
        token,
      });

      console.log(chalk.bold('\n🔄 Monitoring Portfolio'));
      console.log(chalk.gray(`Refreshing every ${options.interval}s. Press Ctrl+C to stop.\n`));

      const refresh = async () => {
        const spinner = ora('Refreshing...').start();
        
        try {
          const portfolio = await client.getPortfolio({
            execution_id: options.execution,
          });

          spinner.stop();
          
          // Clear previous output (simple approach)
          console.clear();
          console.log(chalk.bold('🔄 Portfolio Monitor'));
          console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}\n`));

          const { executions, summary } = portfolio;

          if (executions.length === 0) {
            console.log(chalk.yellow('No active positions'));
            return;
          }

          // Summary line
          console.log(
            `${chalk.cyan(summary.running_executions)} positions | ` +
            `Invested: ${formatUsd(summary.total_invested)} | ` +
            `PnL: ${colorPnl(summary.total_unrealized_pnl)} | ` +
            `ROI: ${colorPercent(summary.weighted_roi / 100)}`
          );
          console.log();

          // Each position
          for (const exec of executions) {
            const { execution, pnl, funding } = exec;
            
            const statusIcon = 
              execution.status === 'running' ? '🟢' :
              execution.status === 'closing' ? '🟡' :
              execution.status === 'queued' ? '🔵' : '⚪';

            console.log(
              `${statusIcon} ${chalk.bold(execution.symbol)} ` +
              `(${execution.long_exchange}/${execution.short_exchange}) | ` +
              `${formatUsd(execution.input_amount)} | ` +
              `PnL: ${colorPnl(pnl.total_pnl)} (${colorPercent(pnl.total_pnl_pct / 100)}) | ` +
              `Funding: ${colorPnl(funding.net_funding)}`
            );
          }

          console.log(chalk.gray('\n[Ctrl+C to exit]'));
          
        } catch (error) {
          spinner.stop();
          printError(error instanceof Error ? error.message : String(error));
        }
      };

      // Initial fetch
      await refresh();

      // Set up interval
      const timer = setInterval(refresh, interval);

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        clearInterval(timer);
        console.log(chalk.gray('\n\nMonitoring stopped.'));
        process.exit(0);
      });
    });
}
