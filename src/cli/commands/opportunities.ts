/**
 * Opportunities Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ZirodeltaClient } from '../../sdk/index.js';
import type { ExchangePair } from '../../sdk/types.js';
import { getToken, getBaseUrl, loadConfig } from '../config.js';
import { createTable, formatPercent, hoursUntil, printError } from '../utils.js';

export function registerOpportunitiesCommand(program: Command): void {
  program
    .command('opportunities')
    .alias('opp')
    .description('List funding rate arbitrage opportunities')
    .option('-p, --pair <pair>', 'Exchange pair (e.g., kucoin-bybit)')
    .option('-l, --limit <n>', 'Number of results', '10')
    .option('-s, --sort <field>', 'Sort by: spread, risk_score, liquidity_score', 'spread')
    .option('-q, --query <symbol>', 'Filter by symbol')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching opportunities...').start();

      try {
        const client = new ZirodeltaClient({
          baseUrl: getBaseUrl(),
          token: getToken(),
        });

        const config = loadConfig();
        const pair = (options.pair || config.defaultExchangePair || 'kucoin-bybit') as ExchangePair;

        const response = await client.getOpportunities({
          exchangepair: pair,
          limit: parseInt(options.limit),
          sortby: options.sort,
          q: options.query,
        });

        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        const { opportunities, pagination } = response;

        if (opportunities.length === 0) {
          console.log(chalk.yellow('No opportunities found'));
          return;
        }

        console.log(chalk.bold(`\n📊 Opportunities (${pair})`));
        console.log(chalk.gray(`Page ${pagination.page}/${pagination.total_pages} • ${pagination.total} total\n`));

        const table = createTable([
          'Symbol',
          'Spread',
          'Long Rate',
          'Short Rate',
          'Next Funding',
          'Risk',
          'ID',
        ]);

        for (const opp of opportunities) {
          table.push([
            chalk.bold(opp.symbol),
            chalk.green(formatPercent(opp.spread / 100, 4)),
            formatPercent(opp.long_funding_rate / 100, 4),
            formatPercent(opp.short_funding_rate / 100, 4),
            hoursUntil(opp.next_funding_time),
            opp.risk_score <= 3 ? chalk.green('Low') : 
              opp.risk_score <= 6 ? chalk.yellow('Med') : chalk.red('High'),
            chalk.gray(opp.id.slice(0, 8)),
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
