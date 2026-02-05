# Zirodelta Agent Toolkit

Agent-native infrastructure for autonomous funding rate farming.

[![npm version](https://img.shields.io/npm/v/zirodelta-agent-toolkit.svg)](https://www.npmjs.com/package/zirodelta-agent-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Zirodelta Agent Toolkit provides everything you need to build autonomous agents that farm funding rate arbitrage opportunities across crypto exchanges.

**What's included:**
- 📦 **TypeScript SDK** - Full-typed client for the Zirodelta API
- 🧠 **Strategy Engine** - Intelligent recommendations based on your balance, risk profile, and targets
- 🖥️ **TUI Dashboard** - Real-time terminal UI for monitoring
- ⌨️ **CLI** - Command-line interface for manual operation
- 📚 **SKILL.md** - Agent-readable documentation for AI integration

## Installation

```bash
npm install zirodelta-agent-toolkit
# or
pnpm add zirodelta-agent-toolkit
# or
yarn add zirodelta-agent-toolkit
```

For CLI usage globally:
```bash
npm install -g zirodelta-agent-toolkit
```

## Quick Start

### SDK Usage

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

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
  amount: 100,  // $100 USD
  mode: 'grid'  // or 'single-direct', 'single-delay'
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

### Strategy Engine (Intelligent Recommendations)

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });
const engine = new StrategyEngine(client);

// Configure your agent's profile
engine.setProfile({
  balances: { bybit: 1000, kucoin: 1000 },
  riskProfile: 'moderate',  // 'conservative' | 'moderate' | 'aggressive'
  dailyTarget: 1.0,         // 1% daily return target
  maxPositionSize: 30,      // Max 30% of capital per position
  maxOpenPositions: 5,
  minSpread: 0.03,          // Minimum 0.03% spread
  exchanges: {
    bybit: { enabled: true },
    kucoin: { enabled: true }
  }
});

// Get smart recommendations based on YOUR situation
const recommendations = await engine.getRecommendations();
console.log('Recommended positions:', recommendations.opportunities);
console.log('Expected daily return:', recommendations.expectedDailyReturn);

// Check progress toward daily target
const progress = await engine.checkTargetProgress();
console.log(`Progress: ${progress.progressPercent}% of daily target`);

// Execute recommended positions
for (const rec of recommendations.opportunities) {
  await client.executeOpportunity({
    opportunity_id: rec.opportunity.id,
    amount: rec.recommendedSize,
    mode: 'grid'
  });
}
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
zirodelta execute opp_123abc --amount 100 --mode grid

# View portfolio
zirodelta portfolio

# Launch TUI dashboard
zirodelta tui

# Monitor positions
zirodelta monitor --interval 30

# Close position
zirodelta close exec_456def --force
```

### Strategy CLI

```bash
# Initialize your agent profile
zirodelta strategy init --risk moderate --bybit 1000 --kucoin 1000

# Show current profile
zirodelta strategy show

# Get personalized recommendations
zirodelta strategy recommend

# Check daily target progress
zirodelta strategy status

# Adjust settings
zirodelta strategy set-target 1.5      # Set 1.5% daily target
zirodelta strategy set-risk aggressive  # Change risk profile
zirodelta strategy set-balance bybit 2000  # Update balance

# Check diversification
zirodelta strategy diversification
zirodelta strategy balances
```

### TUI Dashboard

Launch a real-time terminal dashboard:

```bash
zirodelta tui
```

**Features:**
- 📊 Live opportunities panel (top 10 by spread)
- 💼 Portfolio panel with PnL tracking
- 💰 Funding fees panel (received/paid/net)
- 📈 Stats panel (TVL, volume, ROI)

**Keyboard shortcuts:**
- `q` - Quit
- `r` - Refresh now
- `p` - Switch exchange pair
- `Tab` - Switch panels

## Risk Profiles

| Profile | Min Spread | Max Position | Max Positions | Best For |
|---------|------------|--------------|---------------|----------|
| Conservative | 0.05% | 20% capital | 3 | New agents, small capital |
| Moderate | 0.03% | 40% capital | 5 | Balanced risk/reward |
| Aggressive | 0.01% | 80% capital | 10 | Experienced, high capital |

## Execution Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `grid` | Splits order into grid for better fills | Large positions |
| `single-direct` | One shot, immediate execution | Small positions, speed |
| `single-delay` | One shot with delay between legs | Medium positions |

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
  AgentProfile,
  StrategyRecommendation,
  RiskProfile,
  // ... etc
} from 'zirodelta-agent-toolkit';
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
| `tui` | Launch TUI dashboard |
| `strategy` | Manage agent strategy profile |
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

### Config Files

**CLI config:** `~/.zirodelta/config.json`
```json
{
  "token": "your-token",
  "baseUrl": "https://api.zirodelta.com",
  "defaultExchangePair": "kucoin-bybit",
  "defaultAmount": 100
}
```

**Strategy profile:** `~/.zirodelta/profile.json`
```json
{
  "balances": { "bybit": 1000, "kucoin": 1000 },
  "riskProfile": "moderate",
  "dailyTarget": 1.0,
  "maxPositionSize": 30,
  "maxOpenPositions": 5,
  "minSpread": 0.03,
  "exchanges": {
    "bybit": { "enabled": true },
    "kucoin": { "enabled": true }
  }
}
```

## References

This toolkit is a TypeScript client wrapping the Zirodelta Python backend's JSON-RPC API.

### Source References

| Source | Repository | Commit |
|--------|------------|--------|
| Backend API | `Zirodelta/backend.zirodelta.ag` | `1cd668f` (main) |
| Funding AI | `Zirodelta/funding-ai` | `978f38a` (main) |

### Key Files Referenced

**1. API Documentation** (`endpoint.txt`)
- JSON-RPC methods: `get_opportunities`, `execute_opportunity`, `portfolio_live`, `close_execution`
- REST endpoints: auth, metrics, funding fees
- Request/response schemas

**2. Service Logic** (`app/services/`)
- `opportunity_service.py` — How opportunities are fetched from Redis
- `execution_opportunity_service.py` — Execution modes (`grid`, `single-direct`, `single-delay`)
- `funding_fee_service.py` — Funding fee calculation from Bybit/KuCoin

**3. Funding AI** (`funding-ai/`)
- Delta-neutral hedge concept
- Exchange integrations (Bybit, KuCoin, HyperLiquid, Pacifica)
- DuckDB schema for funding rate analysis

### API Base URL

Production: `https://api.zirodelta.com/api/v1/jsonrpc/`

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

# Test TUI
npm run cli -- tui
```

## Changelog

### v0.3.0
- 🧠 Added Strategy Engine with intelligent recommendations
- ⚖️ Risk profiles (conservative/moderate/aggressive)
- 🎯 Daily target tracking
- 💰 Balance-aware position sizing

### v0.2.0
- 🖥️ Added TUI dashboard with blessed-contrib
- 📊 Real-time monitoring panels

### v0.1.0
- 📦 Initial SDK release
- ⌨️ CLI with core commands
- 📚 SKILL.md for AI agents

## License

MIT © Zirodelta
