#!/usr/bin/env node

/**
 * Zirodelta CLI
 * 
 * Command-line interface for funding rate arbitrage.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  registerOpportunitiesCommand,
  registerExecuteCommand,
  registerPortfolioCommand,
  registerCloseCommand,
  registerFundingCommand,
  registerConfigCommand,
  registerMonitorCommand,
  registerTuiCommand,
  registerStrategyCommand,
} from './commands/index.js';

const program = new Command();

program
  .name('zirodelta')
  .description('Agent-native CLI for funding rate arbitrage')
  .version('0.3.0')
  .option('-d, --debug', 'Enable debug output')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      process.env.DEBUG = 'true';
    }
  });

// Register all commands
registerOpportunitiesCommand(program);
registerExecuteCommand(program);
registerPortfolioCommand(program);
registerCloseCommand(program);
registerFundingCommand(program);
registerConfigCommand(program);
registerMonitorCommand(program);
registerTuiCommand(program);
registerStrategyCommand(program);

// Add help examples
program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.gray('# List top opportunities')}
  $ zirodelta opportunities --pair kucoin-bybit --limit 5

  ${chalk.gray('# Execute an opportunity')}
  $ zirodelta execute opp_123abc --amount 100

  ${chalk.gray('# View portfolio')}
  $ zirodelta portfolio

  ${chalk.gray('# Close a position')}
  $ zirodelta close exec_456def --force

  ${chalk.gray('# Monitor in real-time')}
  $ zirodelta monitor --interval 10

  ${chalk.gray('# Launch TUI dashboard')}
  $ zirodelta tui

  ${chalk.gray('# Set API token')}
  $ zirodelta config set token YOUR_TOKEN

  ${chalk.gray('# Initialize strategy profile')}
  $ zirodelta strategy init --risk moderate --bybit 1000 --kucoin 1000

  ${chalk.gray('# Get recommendations')}
  $ zirodelta strategy recommend

  ${chalk.gray('# Check target progress')}
  $ zirodelta strategy status

${chalk.bold('Environment Variables:')}
  ZIRODELTA_TOKEN      API bearer token
  ZIRODELTA_API_URL    API base URL (default: https://api.zirodelta.com)
`);

program.parse();
