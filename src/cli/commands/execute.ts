/**
 * Execute Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import type { ExecutionMode } from '../../sdk/types.js';
import { getToken, getBaseUrl, loadConfig } from '../config.js';
import { printError, printSuccess, printWarning } from '../utils.js';

export function registerExecuteCommand(program: Command): void {
  program
    .command('execute <opportunity_id>')
    .alias('exec')
    .description('Execute an arbitrage opportunity')
    .requiredOption('-a, --amount <usd>', 'Amount in USD to trade')
    .option('-m, --mode <mode>', 'Execution mode: auto or manual', 'auto')
    .option('--dry-run', 'Simulate execution without trading')
    .option('--json', 'Output as JSON')
    .action(async (opportunityId: string, options) => {
      const token = getToken();
      if (!token) {
        printError('Authentication required. Set ZIRODELTA_TOKEN or run: zirodelta config set token <token>');
        process.exit(1);
      }

      const amount = parseFloat(options.amount);
      if (isNaN(amount) || amount <= 0) {
        printError('Invalid amount. Must be a positive number.');
        process.exit(1);
      }

      const config = loadConfig();
      const minAmount = 10;
      const maxAmount = 10000;

      if (amount < minAmount) {
        printError(`Minimum amount is $${minAmount}`);
        process.exit(1);
      }

      if (amount > maxAmount) {
        printWarning(`Large amount: $${amount}. Consider starting smaller.`);
      }

      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 Dry run mode - no actual trade will be executed\n'));
        console.log('Would execute:');
        console.log(`  Opportunity: ${opportunityId}`);
        console.log(`  Amount: $${amount}`);
        console.log(`  Mode: ${options.mode}`);
        return;
      }

      const spinner = ora('Submitting execution...').start();

      try {
        const client = new ZirodeltaClient({
          baseUrl: getBaseUrl(),
          token,
        });

        const result = await client.executeOpportunity({
          opportunity_id: opportunityId,
          amount,
          mode: options.mode as ExecutionMode,
        });

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (result.success) {
          printSuccess('Execution submitted successfully!\n');
          console.log(chalk.bold('Execution Details:'));
          console.log(`  Job ID:       ${chalk.cyan(result.job_id)}`);
          console.log(`  Execution ID: ${chalk.cyan(result.execution_id)}`);
          console.log(`  Status:       ${chalk.yellow('Queued')}`);
          console.log(`  Amount:       $${amount}`);
          console.log();
          console.log(chalk.gray('Track progress: zirodelta portfolio'));
        } else {
          printError(result.message || 'Execution failed');
        }
      } catch (error) {
        spinner.stop();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
