# SKILL.md - For AI Agents

This page contains the agent-readable documentation for AI integration.

## What is Funding Rate Arbitrage?

Funding rates are periodic payments between long and short traders on perpetual futures exchanges. When rates diverge between exchanges, you can profit by:

1. **Going long** on the exchange with lower (or negative) funding rate
2. **Going short** on the exchange with higher (or positive) funding rate
3. **Collecting the spread** while positions hedge each other

### Example

```
Bybit BTC/USDT:  +0.01% funding (longs pay shorts)
KuCoin BTC/USDT: -0.02% funding (shorts pay longs)
Spread: 0.03% per 8h = 0.09% daily = ~33% APY
```

## Quick Start for Agents

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({
  token: process.env.ZIRODELTA_TOKEN
});

// Find opportunities
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 5,
  sortby: 'spread'
});

// Execute best opportunity
const best = opportunities[0];
if (best.spread > 0.005) {  // > 0.5% spread
  await client.executeOpportunity({
    opportunity_id: best.id,
    amount: 100  // $100 USD
  });
}

// Monitor portfolio
const portfolio = await client.getPortfolio();
console.log('Total PnL:', portfolio.summary.total_unrealized_pnl);

// Close when target reached
if (portfolio.summary.weighted_roi > 0.05) {  // > 5% ROI
  for (const exec of portfolio.executions) {
    await client.closeExecution({ 
      execution_id: exec.execution.id 
    });
  }
}
```

## Key Methods

| Method | Auth | Description |
|--------|------|-------------|
| `getOpportunities()` | No | Find arbitrage opportunities |
| `getOpportunityDetail()` | No | Get opportunity details |
| `executeOpportunity()` | **Yes** | Open a position |
| `getPortfolio()` | **Yes** | View current positions |
| `closeExecution()` | **Yes** | Close a position |
| `checkPairStatus()` | **Yes** | Check if pair is active |

## Decision Framework

```
IF spread > minThreshold AND
   balance >= requiredAmount AND
   openPositions < maxPositions
THEN execute opportunity
```

Recommended thresholds:
- `minSpread`: 0.03% (conservative) to 0.01% (aggressive)
- `minAmount`: $50 USD
- `maxPositions`: 3-5 concurrent

## Risk Management

1. **Never over-leverage** - Keep positions balanced between exchanges
2. **Monitor funding changes** - Rates can flip, eroding profits
3. **Set stop conditions** - Close if ROI goes negative beyond threshold
4. **Diversify** - Don't put all capital in one position

## Next Steps

- [Autonomous Loop](/agents/autonomous) - Full agent implementation
- [Authentication](/agents/auth) - Getting and using tokens
