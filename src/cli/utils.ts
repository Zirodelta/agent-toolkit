/**
 * CLI Utilities
 */

import chalk from 'chalk';
import Table from 'cli-table3';

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function formatPercent(n: number, decimals = 2): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(decimals)}%`;
}

export function formatUsd(n: number): string {
  const sign = n >= 0 ? '' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function colorPnl(n: number): string {
  const formatted = formatUsd(n);
  if (n > 0) return chalk.green(formatted);
  if (n < 0) return chalk.red(formatted);
  return chalk.gray(formatted);
}

export function colorPercent(n: number): string {
  const formatted = formatPercent(n);
  if (n > 0) return chalk.green(formatted);
  if (n < 0) return chalk.red(formatted);
  return chalk.gray(formatted);
}

export function createTable(head: string[]): Table.Table {
  return new Table({
    head: head.map(h => chalk.cyan(h)),
    style: {
      head: [],
      border: [],
    },
  });
}

export function printError(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function printSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function printWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function hoursUntil(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const hours = (then - now) / (1000 * 60 * 60);
  
  if (hours < 0) return 'passed';
  if (hours < 1) return `${Math.floor(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}
