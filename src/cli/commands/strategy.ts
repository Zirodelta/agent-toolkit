/**
 * Strategy Command
 * 
 * CLI commands for the strategy engine.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ZirodeltaClient } from '../../sdk/client.js';
import { getToken, getBaseUrl } from '../config.js';
import { createTable, printSuccess, printError, printInfo, printWarning, colorPercent, colorPnl } from '../utils.js';
import {
  StrategyEngine,
  getDefaultProfile,
  getRiskProfile,
  RISK_PROFILES,
} from '../../strategy/index.js';
import type { AgentProfile, RiskProfileType } from '../../strategy/types.js';

// ============================================================================
// Profile Storage
// ============================================================================

const PROFILE_DIR = join(homedir(), '.zirodelta');
const PROFILE_FILE = join(PROFILE_DIR, 'profile.json');

function loadProfile(): AgentProfile | null {
  try {
    if (!existsSync(PROFILE_FILE)) {
      return null;
    }
    const content = readFileSync(PROFILE_FILE, 'utf-8');
    return JSON.parse(content) as AgentProfile;
  } catch {
    return null;
  }
}

function saveProfile(profile: AgentProfile): void {
  if (!existsSync(PROFILE_DIR)) {
    mkdirSync(PROFILE_DIR, { recursive: true });
  }
  writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

function getClient(): ZirodeltaClient {
  const token = getToken();
  return new ZirodeltaClient({
    baseUrl: getBaseUrl(),
    token,
  });
}

function requireProfile(): AgentProfile {
  const profile = loadProfile();
  if (!profile) {
    printError('No profile configured. Run: zirodelta strategy init');
    process.exit(1);
  }
  return profile;
}

// ============================================================================
// Command Registration
// ============================================================================

export function registerStrategyCommand(program: Command): void {
  const strategyCmd = program
    .command('strategy')
    .description('Agent strategy engine commands');

  // ============================================================================
  // strategy init
  // ============================================================================
  strategyCmd
    .command('init')
    .description('Initialize agent profile (interactive)')
    .option('--risk <type>', 'Risk profile (conservative, moderate, aggressive)', 'moderate')
    .option('--target <percent>', 'Daily target return %', '1.0')
    .option('--bybit <amount>', 'Bybit balance in USDT')
    .option('--kucoin <amount>', 'KuCoin balance in USDT')
    .action(async (options) => {
      console.log(chalk.bold('\n🤖 Zirodelta Agent Profile Setup\n'));

      // Start with defaults
      let profile = getDefaultProfile();

      // Set risk profile
      const riskType = options.risk as RiskProfileType;
      if (!['conservative', 'moderate', 'aggressive'].includes(riskType)) {
        printError('Invalid risk profile. Use: conservative, moderate, or aggressive');
        process.exit(1);
      }
      profile.riskProfile = riskType;
      const riskSettings = getRiskProfile(riskType);
      profile.minSpread = riskSettings.minSpread;
      profile.maxPositionSize = riskSettings.maxPositionSizePercent;

      // Set daily target
      const target = parseFloat(options.target);
      if (isNaN(target) || target < 0 || target > 100) {
        printError('Daily target must be between 0 and 100%');
        process.exit(1);
      }
      profile.dailyTarget = target;

      // Set balances
      if (options.bybit) {
        const bybitBalance = parseFloat(options.bybit);
        if (isNaN(bybitBalance) || bybitBalance < 0) {
          printError('Bybit balance must be a positive number');
          process.exit(1);
        }
        profile.balances.bybit = bybitBalance;
      }

      if (options.kucoin) {
        const kucoinBalance = parseFloat(options.kucoin);
        if (isNaN(kucoinBalance) || kucoinBalance < 0) {
          printError('KuCoin balance must be a positive number');
          process.exit(1);
        }
        profile.balances.kucoin = kucoinBalance;
      }

      // Save profile
      saveProfile(profile);

      // Show summary
      console.log(chalk.cyan('Profile Configuration:'));
      console.log(`  Risk Profile:     ${chalk.yellow(profile.riskProfile)}`);
      console.log(`  Daily Target:     ${chalk.yellow(profile.dailyTarget + '%')}`);
      console.log(`  Max Position:     ${chalk.yellow(profile.maxPositionSize + '%')} of capital`);
      console.log(`  Max Positions:    ${chalk.yellow(profile.maxOpenPositions.toString())}`);
      console.log(`  Min Spread:       ${chalk.yellow((profile.minSpread * 100).toFixed(1) + '%')}`);
      console.log();
      console.log(chalk.cyan('Balances:'));
      for (const [exchange, balance] of Object.entries(profile.balances)) {
        console.log(`  ${exchange}:`.padEnd(16) + chalk.green('$' + balance.toFixed(2)));
      }
      console.log();

      if (Object.keys(profile.balances).length === 0) {
        printWarning('No balances configured. Set with: zirodelta strategy set-balance bybit 1000');
      }

      printSuccess(`Profile saved to ${PROFILE_FILE}`);
    });

  // ============================================================================
  // strategy show
  // ============================================================================
  strategyCmd
    .command('show')
    .description('Show current profile')
    .action(() => {
      const profile = requireProfile();

      console.log(chalk.bold('\n🤖 Agent Profile\n'));
      
      console.log(chalk.cyan('Settings:'));
      console.log(`  Risk Profile:     ${chalk.yellow(profile.riskProfile)}`);
      console.log(`  Daily Target:     ${chalk.yellow(profile.dailyTarget + '%')}`);
      console.log(`  Max Position:     ${chalk.yellow(profile.maxPositionSize + '%')} of capital`);
      console.log(`  Max Positions:    ${chalk.yellow(profile.maxOpenPositions.toString())}`);
      console.log(`  Min Spread:       ${chalk.yellow((profile.minSpread * 100).toFixed(1) + '%')}`);
      console.log();

      console.log(chalk.cyan('Exchanges:'));
      for (const [exchange, config] of Object.entries(profile.exchanges)) {
        const status = config.enabled ? chalk.green('enabled') : chalk.gray('disabled');
        const balance = profile.balances[exchange];
        const balanceStr = balance ? chalk.green('$' + balance.toFixed(2)) : chalk.gray('no balance');
        console.log(`  ${exchange}:`.padEnd(16) + `${status}  ${balanceStr}`);
      }
      console.log();

      const total = Object.values(profile.balances).reduce((a, b) => a + b, 0);
      console.log(chalk.cyan('Total Capital:'), chalk.bold.green('$' + total.toFixed(2)));
      console.log();
    });

  // ============================================================================
  // strategy recommend
  // ============================================================================
  strategyCmd
    .command('recommend')
    .description('Get recommendations for current profile')
    .option('-n, --limit <number>', 'Max recommendations to show', '5')
    .action(async (options) => {
      const profile = requireProfile();
      const client = getClient();
      const engine = new StrategyEngine(client);
      engine.setProfile(profile);

      const spinner = ora('Analyzing opportunities...').start();

      try {
        const recommendations = await engine.getRecommendations();
        spinner.stop();

        console.log(chalk.bold('\n📊 Strategy Recommendations\n'));

        // Summary
        console.log(chalk.cyan('Summary:'));
        console.log(`  ${recommendations.summary}`);
        console.log();

        // Progress
        const progressBar = getProgressBar(recommendations.progressToTarget);
        console.log(chalk.cyan('Target Progress:'));
        console.log(`  ${progressBar} ${recommendations.progressToTarget.toFixed(0)}% of ${profile.dailyTarget}% target`);
        console.log(`  Expected Daily Return: ${colorPercent(recommendations.expectedDailyReturn / 100)}`);
        console.log(`  Capital Utilization:   ${recommendations.capitalUtilization.toFixed(0)}%`);
        console.log(`  Risk Level:            ${getRiskBadge(recommendations.riskLevel)}`);
        console.log();

        // Warnings
        if (recommendations.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:'));
          for (const warning of recommendations.warnings) {
            console.log(`  • ${warning}`);
          }
          console.log();
        }

        // Opportunities
        if (recommendations.opportunities.length > 0) {
          const limit = parseInt(options.limit);
          const toShow = recommendations.opportunities.slice(0, limit);

          const table = createTable([
            'Symbol',
            'Pair',
            'Spread',
            'Size',
            'Expected',
            'Risk',
            'Score',
          ]);

          for (const rec of toShow) {
            const opp = rec.opportunity;
            table.push([
              chalk.white(opp.symbol),
              `${rec.exchange.long}→${rec.exchange.short}`,
              chalk.green((opp.spread * 100).toFixed(2) + '%'),
              chalk.yellow('$' + rec.recommendedSize.toFixed(0)),
              colorPercent(rec.expectedReturn / 100),
              getRiskScore(rec.riskScore),
              rec.score.toFixed(1),
            ]);
          }

          console.log(chalk.cyan('Recommended Opportunities:'));
          console.log(table.toString());
          console.log();

          // Show reasoning for top pick
          if (toShow.length > 0) {
            const top = toShow[0];
            console.log(chalk.cyan('Top Pick Analysis:'));
            for (const reason of top.reasoning) {
              console.log(`  • ${reason}`);
            }
            console.log();
          }
        } else {
          printInfo('No opportunities match your criteria right now.');
        }

      } catch (error) {
        spinner.stop();
        printError((error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // strategy status
  // ============================================================================
  strategyCmd
    .command('status')
    .description('Show target progress and current allocations')
    .action(async () => {
      const profile = requireProfile();
      const client = getClient();
      const engine = new StrategyEngine(client);
      engine.setProfile(profile);

      const spinner = ora('Fetching status...').start();

      try {
        const progress = await engine.checkTargetProgress();
        spinner.stop();

        console.log(chalk.bold('\n📈 Strategy Status\n'));

        // Target progress
        const progressBar = getProgressBar(progress.progressPercent);
        console.log(chalk.cyan('Daily Target Progress:'));
        console.log(`  Target:   ${profile.dailyTarget}% daily return`);
        console.log(`  Current:  ${colorPercent(progress.currentDailyReturn / 100)}`);
        console.log(`  Progress: ${progressBar} ${progress.progressPercent.toFixed(0)}%`);
        console.log();

        // Capital allocation
        console.log(chalk.cyan('Capital Allocation:'));
        console.log(`  Deployed:  ${chalk.yellow('$' + progress.totalDeployed.toFixed(2))}`);
        console.log(`  Available: ${chalk.green('$' + progress.totalAvailable.toFixed(2))}`);
        console.log(`  Total:     ${chalk.bold('$' + (progress.totalDeployed + progress.totalAvailable).toFixed(2))}`);
        console.log();

        // Current positions
        if (progress.currentPositions.length > 0) {
          const table = createTable([
            'Symbol',
            'Size',
            'PnL',
            'Hours',
            'Daily Est.',
          ]);

          for (const pos of progress.currentPositions) {
            table.push([
              pos.symbol,
              '$' + pos.size.toFixed(0),
              colorPnl(pos.unrealizedPnl),
              pos.hoursOpen.toFixed(1) + 'h',
              colorPercent(pos.expectedDailyReturn / 100),
            ]);
          }

          console.log(chalk.cyan('Active Positions:'));
          console.log(table.toString());
          console.log();
        } else {
          printInfo('No active positions.');
          console.log();
        }

        // Suggestions
        if (progress.suggestions.length > 0) {
          console.log(chalk.cyan('Suggestions:'));
          for (const suggestion of progress.suggestions) {
            console.log(`  • ${suggestion}`);
          }
          console.log();
        }

        // Positions needed
        if (progress.positionsNeededForTarget > 0) {
          printInfo(`Need ~${progress.positionsNeededForTarget} more position(s) to hit target.`);
        }

      } catch (error) {
        spinner.stop();
        printError((error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // strategy set-target
  // ============================================================================
  strategyCmd
    .command('set-target <percent>')
    .description('Set daily target return %')
    .action((percent: string) => {
      const profile = requireProfile();
      const target = parseFloat(percent);

      if (isNaN(target) || target < 0 || target > 100) {
        printError('Target must be a number between 0 and 100');
        process.exit(1);
      }

      profile.dailyTarget = target;
      profile.updatedAt = new Date().toISOString();
      saveProfile(profile);

      printSuccess(`Daily target set to ${target}%`);
    });

  // ============================================================================
  // strategy set-risk
  // ============================================================================
  strategyCmd
    .command('set-risk <profile>')
    .description('Set risk profile (conservative, moderate, aggressive)')
    .action((riskProfile: string) => {
      const profile = requireProfile();

      if (!['conservative', 'moderate', 'aggressive'].includes(riskProfile)) {
        printError('Invalid risk profile. Use: conservative, moderate, or aggressive');
        console.log();
        console.log(chalk.cyan('Risk Profiles:'));
        for (const [type, settings] of Object.entries(RISK_PROFILES)) {
          console.log(`  ${chalk.yellow(type)}:`);
          console.log(`    Max position: ${settings.maxPositionSizePercent}% | Min spread: ${(settings.minSpread * 100).toFixed(0)}% | Stop loss: ${settings.stopLossPercent}%`);
        }
        process.exit(1);
      }

      const riskType = riskProfile as RiskProfileType;
      const riskSettings = getRiskProfile(riskType);

      profile.riskProfile = riskType;
      profile.minSpread = riskSettings.minSpread;
      profile.maxPositionSize = riskSettings.maxPositionSizePercent;
      profile.updatedAt = new Date().toISOString();
      saveProfile(profile);

      printSuccess(`Risk profile set to ${riskProfile}`);
      console.log(`  Min spread:     ${(riskSettings.minSpread * 100).toFixed(0)}%`);
      console.log(`  Max position:   ${riskSettings.maxPositionSizePercent}%`);
      console.log(`  Stop loss:      ${riskSettings.stopLossPercent}%`);
    });

  // ============================================================================
  // strategy set-balance
  // ============================================================================
  strategyCmd
    .command('set-balance <exchange> <amount>')
    .description('Set balance for an exchange')
    .action((exchange: string, amount: string) => {
      const profile = requireProfile();
      const balance = parseFloat(amount);

      if (isNaN(balance) || balance < 0) {
        printError('Amount must be a positive number');
        process.exit(1);
      }

      profile.balances[exchange] = balance;
      if (!profile.exchanges[exchange]) {
        profile.exchanges[exchange] = { enabled: true };
      }
      profile.updatedAt = new Date().toISOString();
      saveProfile(profile);

      const total = Object.values(profile.balances).reduce((a, b) => a + b, 0);
      printSuccess(`${exchange} balance set to $${balance.toFixed(2)}`);
      console.log(`  Total capital: $${total.toFixed(2)}`);
    });

  // ============================================================================
  // strategy diversification
  // ============================================================================
  strategyCmd
    .command('diversification')
    .description('Analyze position diversification')
    .action(async () => {
      const profile = requireProfile();
      const client = getClient();
      const engine = new StrategyEngine(client);
      engine.setProfile(profile);

      const spinner = ora('Analyzing diversification...').start();

      try {
        await engine.refreshPositions();
        const analysis = engine.getDiversificationAnalysis();
        spinner.stop();

        console.log(chalk.bold('\n🎯 Diversification Analysis\n'));

        // Score
        const scoreColor = analysis.score >= 70 ? chalk.green : analysis.score >= 40 ? chalk.yellow : chalk.red;
        console.log(`Diversification Score: ${scoreColor(analysis.score.toFixed(0) + '/100')}`);
        console.log();

        // By exchange
        if (Object.keys(analysis.byExchange).length > 0) {
          console.log(chalk.cyan('Exposure by Exchange:'));
          for (const [exchange, exposure] of Object.entries(analysis.byExchange)) {
            const bar = getExposureBar(exposure);
            console.log(`  ${exchange.padEnd(12)} ${bar} ${exposure.toFixed(1)}%`);
          }
          console.log();
        }

        // By symbol
        if (Object.keys(analysis.bySymbol).length > 0) {
          console.log(chalk.cyan('Exposure by Symbol:'));
          for (const [symbol, exposure] of Object.entries(analysis.bySymbol)) {
            const bar = getExposureBar(exposure);
            console.log(`  ${symbol.padEnd(12)} ${bar} ${exposure.toFixed(1)}%`);
          }
          console.log();
        }

        // Warnings
        if (analysis.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:'));
          for (const warning of analysis.warnings) {
            console.log(`  • ${warning}`);
          }
          console.log();
        }

        // Suggestions
        if (analysis.suggestions.length > 0) {
          console.log(chalk.cyan('Suggestions:'));
          for (const suggestion of analysis.suggestions) {
            console.log(`  • ${suggestion}`);
          }
          console.log();
        }

      } catch (error) {
        spinner.stop();
        printError((error as Error).message);
        process.exit(1);
      }
    });

  // ============================================================================
  // strategy balances
  // ============================================================================
  strategyCmd
    .command('balances')
    .description('Show balance summary and rebalancing suggestions')
    .action(async () => {
      const profile = requireProfile();
      const client = getClient();
      const engine = new StrategyEngine(client);
      engine.setProfile(profile);

      const spinner = ora('Calculating balances...').start();

      try {
        await engine.refreshPositions();
        const summary = engine.getBalanceSummary();
        spinner.stop();

        console.log(chalk.bold('\n💰 Balance Summary\n'));

        const table = createTable([
          'Exchange',
          'Total',
          'Available',
          'Allocated',
          'Margin',
        ]);

        for (const balance of summary.balances) {
          table.push([
            balance.exchange,
            chalk.bold('$' + balance.total.toFixed(2)),
            chalk.green('$' + balance.available.toFixed(2)),
            chalk.yellow('$' + balance.allocated.toFixed(2)),
            chalk.gray('$' + balance.margin.toFixed(2)),
          ]);
        }

        console.log(table.toString());
        console.log();

        console.log(chalk.cyan('Totals:'));
        console.log(`  Capital:   ${chalk.bold('$' + summary.totalCapital.toFixed(2))}`);
        console.log(`  Available: ${chalk.green('$' + summary.totalAvailable.toFixed(2))}`);
        console.log(`  Allocated: ${chalk.yellow('$' + summary.totalAllocated.toFixed(2))}`);
        console.log();

        // Rebalance suggestions
        if (summary.rebalanceSuggestions.length > 0) {
          console.log(chalk.cyan('Rebalancing Suggestions:'));
          for (const suggestion of summary.rebalanceSuggestions) {
            console.log(`  • Transfer $${suggestion.amount.toFixed(0)} from ${suggestion.from} to ${suggestion.to}`);
            console.log(`    ${chalk.gray(suggestion.reason)}`);
          }
          console.log();
        }

      } catch (error) {
        spinner.stop();
        printError((error as Error).message);
        process.exit(1);
      }
    });
}

// ============================================================================
// Helpers
// ============================================================================

function getProgressBar(percent: number): string {
  const filled = Math.min(20, Math.round(percent / 5));
  const empty = 20 - filled;
  const color = percent >= 100 ? chalk.green : percent >= 50 ? chalk.yellow : chalk.red;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function getExposureBar(percent: number): string {
  const filled = Math.min(10, Math.round(percent / 10));
  const color = percent > 50 ? chalk.red : percent > 30 ? chalk.yellow : chalk.green;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(10 - filled));
}

function getRiskBadge(level: string): string {
  switch (level) {
    case 'low': return chalk.green('● Low');
    case 'medium': return chalk.yellow('● Medium');
    case 'high': return chalk.red('● High');
    default: return level;
  }
}

function getRiskScore(score: number): string {
  if (score < 30) return chalk.green(score.toFixed(0));
  if (score < 60) return chalk.yellow(score.toFixed(0));
  return chalk.red(score.toFixed(0));
}
