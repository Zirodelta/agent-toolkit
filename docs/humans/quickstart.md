# Quick Start

Get your first funding rate arbitrage position running in 5 minutes.

## 1. Install & Configure

```bash
npm install zirodelta-agent-toolkit
export ZIRODELTA_TOKEN="your-token"
```

## 2. Find Opportunities

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });

const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 10,
  sortby: 'spread'
});

console.log('Top opportunities:');
opportunities.forEach(opp => {
  console.log(`${opp.symbol}: ${(opp.spread * 100).toFixed(3)}% spread`);
});
```

## 3. Execute a Position

```typescript
const best = opportunities[0];

if (best.spread > 0.0003) { // > 0.03% spread
  const result = await client.executeOpportunity({
    opportunity_id: best.id,
    amount: 100, // $100 USD
    mode: 'grid' // 'grid' | 'single-direct' | 'single-delay'
  });
  
  console.log('Position opened:', result.execution_id);
}
```

## 4. Monitor Your Portfolio

```typescript
const portfolio = await client.getPortfolio();

console.log('Summary:');
console.log(`  Total PnL: $${portfolio.summary.total_unrealized_pnl}`);
console.log(`  ROI: ${(portfolio.summary.weighted_roi * 100).toFixed(2)}%`);

portfolio.executions.forEach(exec => {
  console.log(`  ${exec.symbol}: $${exec.pnl} (${exec.roi}%)`);
});
```

## 5. Close When Ready

```typescript
// Close a specific position
await client.closeExecution({
  execution_id: 'exec_xyz789'
});

// Or close all positions
for (const exec of portfolio.executions) {
  await client.closeExecution({
    execution_id: exec.execution.id
  });
}
```

## Execution Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `grid` | Split into multiple orders at different prices | Default, reduces slippage |
| `single-direct` | One market order immediately | Fast execution |
| `single-delay` | One order with delay between legs | Volatile markets |

## Next Steps

- [CLI Reference](/humans/cli) - Command-line interface
- [Strategy Engine](/humans/strategy) - Automated recommendations
- [API Reference](/api/) - Full SDK documentation
