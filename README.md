# Zirodelta Agent Toolkit

Agent-native infrastructure for autonomous funding rate farming.

[![npm version](https://img.shields.io/npm/v/@zirodelta/agent-toolkit.svg)](https://www.npmjs.com/package/@zirodelta/agent-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Zirodelta Agent Toolkit provides everything you need to build autonomous agents that farm funding rate arbitrage opportunities across crypto exchanges.

**What's included:**
- 📦 **TypeScript SDK** - Full-typed client for the Zirodelta API
- 🖥️ **CLI** - Command-line interface for manual operation
- 📚 **SKILL.md** - Agent-readable documentation for AI integration

## Installation

```bash
npm install @zirodelta/agent-toolkit
# or
pnpm add @zirodelta/agent-toolkit
# or
yarn add @zirodelta/agent-toolkit
```

For CLI usage globally:
```bash
npm install -g @zirodelta/agent-toolkit
```

## Quick Start

### SDK Usage

```typescript
import { ZirodeltaClient } from '@zirodelta/agent-toolkit';

const client = new ZirodeltaClient({
  token: process.env.ZIRODELTA_TOKEN
});

// Get arbitrage opportunities
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 10,
  sortby: 'spread'
});

console.log('Top opportunity:', opportunities[0]);

// Execute an opportunity
const result = await client.executeOpportunity({
  opportunity_id: opportunities[0].id,
  amount: 100  // $100 USD
});

console.log('Execution started:', result.execution_id);

// Check portfolio
const portfolio = await client.getPortfolio();
console.log('Total PnL:', portfolio.summary.total_unrealized_pnl);

// Close when ready
await client.closeExecution({
  execution_id: result.execution_id
});
```

### CLI Usage

```bash
# Configure token
export ZIRODELTA_TOKEN="your-token"
# or
zirodelta config set token your-token

# List opportunities
zirodelta opportunities --pair kucoin-bybit --limit 5

# Execute
zirodelta execute opp_123abc --amount 100

# View portfolio
zirodelta portfolio

# Monitor positions
zirodelta monitor --interval 30

# Close position
zirodelta close exec_456def --force
```

## SDK Reference

### Constructor

```typescript
const client = new ZirodeltaClient({
  baseUrl?: string,    // API base URL (default: https://api.zirodelta.com)
  token?: string,      // Bearer token for authentication
  timeout?: number,    // Request timeout in ms (default: 30000)
  debug?: boolean      // Enable debug logging
});
```

### Methods

| Method | Description | Auth Required |
|--------|-------------|---------------|
| `getExchangePairs()` | List available exchange pairs | No |
| `getOpportunities(params)` | Get arbitrage opportunities | No |
| `getOpportunityDetail(id)` | Get opportunity details | No |
| `executeOpportunity(params)` | Execute an opportunity | Yes |
| `getPortfolio(params?)` | Get live portfolio | Yes |
| `closeExecution(params)` | Close a position | Yes |
| `getFundingFees()` | Get funding fees breakdown | Yes |
| `getMetrics()` | Get platform metrics | No |

### Types

All types are fully exported:

```typescript
import type {
  Opportunity,
  Execution,
  Portfolio,
  ExchangePair,
  // ... etc
} from '@zirodelta/agent-toolkit';
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `opportunities` | List arbitrage opportunities |
| `execute <id>` | Execute an opportunity |
| `portfolio` | View current positions |
| `close <id>` | Close a position |
| `funding` | View funding fees breakdown |
| `monitor` | Real-time portfolio monitoring |
| `config` | Manage CLI configuration |

Run `zirodelta --help` for full usage.

## For AI Agents

See [SKILL.md](./SKILL.md) for agent-readable documentation including:
- How funding rate arbitrage works
- API endpoint reference
- Example autonomous workflows
- Decision criteria and risk management

## Configuration

### Environment Variables

```bash
ZIRODELTA_TOKEN      # API bearer token
ZIRODELTA_API_URL    # API base URL (optional)
```

### Config File

The CLI stores configuration in `~/.zirodelta/config.json`:

```json
{
  "token": "your-token",
  "baseUrl": "https://api.zirodelta.com",
  "defaultExchangePair": "kucoin-bybit",
  "defaultAmount": 100
}
```

## Development

```bash
# Clone
git clone https://github.com/Zirodelta/agent-toolkit.git
cd agent-toolkit

# Install dependencies
npm install

# Build
npm run build

# Run CLI in dev mode
npm run cli -- opportunities --help
```

## License

MIT © Zirodelta
