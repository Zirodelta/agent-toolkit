# Strategy Engine

Intelligent recommendations based on your balance, risk profile, and targets.

## Overview

The Strategy Engine analyzes your situation and recommends optimal positions:

- **Balance-aware**: Only recommends what you can afford
- **Risk-adjusted**: Matches your risk tolerance
- **Target-driven**: Optimizes for your daily return goals
- **Diversified**: Spreads risk across multiple positions

## Basic Usage

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });
const engine = new StrategyEngine(client);

// Set your profile
engine.setProfile({
  balances: { bybit: 1000, kucoin: 1000 },
  riskProfile: 'moderate',
  dailyTarget: 1.0, // 1% daily
  maxPositionSize: 30, // 30% max per position
  maxOpenPositions: 5,
  minSpread: 0.03
});

// Get recommendations
const recs = await engine.getRecommendations();
console.log(recs.opportunities);
```

## Risk Profiles

### Conservative

```typescript
engine.setProfile({ riskProfile: 'conservative' });
```

- Lower position sizes (max 20%)
- Higher minimum spread (0.05%)
- Fewer concurrent positions (3 max)
- Prioritizes stability over returns

### Moderate (Default)

```typescript
engine.setProfile({ riskProfile: 'moderate' });
```

- Balanced position sizes (max 30%)
- Standard minimum spread (0.03%)
- Up to 5 concurrent positions
- Good risk/reward balance

### Aggressive

```typescript
engine.setProfile({ riskProfile: 'aggressive' });
```

- Larger position sizes (max 50%)
- Lower minimum spread (0.01%)
- More concurrent positions (10 max)
- Maximizes returns, higher risk

## Profile Options

| Option | Type | Description |
|--------|------|-------------|
| `balances` | `Record<string, number>` | Available balance per exchange |
| `riskProfile` | `'conservative' \| 'moderate' \| 'aggressive'` | Risk tolerance |
| `dailyTarget` | `number` | Target daily return % |
| `maxPositionSize` | `number` | Max % of capital per position |
| `maxOpenPositions` | `number` | Max concurrent positions |
| `minSpread` | `number` | Minimum spread to consider |
| `exchanges` | `Record<string, { enabled: boolean }>` | Exchange toggles |

## Auto-Execute Mode

Let the engine manage positions automatically:

```typescript
// Enable auto-execution
engine.setAutoExecute(true, {
  checkInterval: 60000, // Check every minute
  maxDailyTrades: 10,
  stopOnDailyTarget: true
});

// Start the engine
await engine.start();

// Monitor progress
engine.on('trade', (trade) => {
  console.log('Executed:', trade);
});

engine.on('targetReached', () => {
  console.log('Daily target reached!');
});

// Stop when done
engine.stop();
```
