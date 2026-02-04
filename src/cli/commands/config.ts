/**
 * Config Command
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, getConfigPath } from '../config.js';
import { printSuccess, printError, printInfo } from '../utils.js';

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage CLI configuration');

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const config = loadConfig();
      console.log(chalk.bold('\n⚙️  Zirodelta CLI Configuration\n'));
      console.log(`  Config file: ${chalk.gray(getConfigPath())}`);
      console.log();
      console.log(`  token:               ${config.token ? chalk.green('****' + config.token.slice(-4)) : chalk.gray('not set')}`);
      console.log(`  baseUrl:             ${config.baseUrl || chalk.gray('default')}`);
      console.log(`  defaultExchangePair: ${config.defaultExchangePair || chalk.gray('kucoin-bybit')}`);
      console.log(`  defaultAmount:       ${config.defaultAmount ? `$${config.defaultAmount}` : chalk.gray('not set')}`);
      console.log();
    });

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const config = loadConfig();
      
      const validKeys = ['token', 'baseUrl', 'defaultExchangePair', 'defaultAmount'];
      if (!validKeys.includes(key)) {
        printError(`Invalid key: ${key}. Valid keys: ${validKeys.join(', ')}`);
        process.exit(1);
      }

      if (key === 'defaultAmount') {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          printError('defaultAmount must be a positive number');
          process.exit(1);
        }
        (config as Record<string, unknown>)[key] = num;
      } else {
        (config as Record<string, unknown>)[key] = value;
      }

      saveConfig(config);
      printSuccess(`Set ${key} = ${key === 'token' ? '****' : value}`);
    });

  configCmd
    .command('unset <key>')
    .description('Remove a configuration value')
    .action((key: string) => {
      const config = loadConfig();
      
      if (!(key in config)) {
        printInfo(`${key} is not set`);
        return;
      }

      delete (config as Record<string, unknown>)[key];
      saveConfig(config);
      printSuccess(`Removed ${key}`);
    });

  configCmd
    .command('path')
    .description('Show config file path')
    .action(() => {
      console.log(getConfigPath());
    });
}
