/**
 * CLI Configuration Management
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CliConfig {
  token?: string;
  baseUrl?: string;
  defaultExchangePair?: string;
  defaultAmount?: number;
}

const CONFIG_DIR = join(homedir(), '.zirodelta');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): CliConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return {};
    }
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as CliConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: CliConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getToken(): string | undefined {
  // Priority: env var > config file
  return process.env.ZIRODELTA_TOKEN || loadConfig().token;
}

export function getBaseUrl(): string {
  return process.env.ZIRODELTA_API_URL || loadConfig().baseUrl || 'https://api.zirodelta.xyz';
}
