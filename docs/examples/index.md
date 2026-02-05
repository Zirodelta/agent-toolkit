# Examples

Practical code examples for common use cases.

## Basic: Find and Display Opportunities

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient();

async function findOpportunities() {
  const { opportunities } = await client.getOpportunities({
    exchangepair: 'kucoin-bybit',
    limit: 10,
    sortby: 'spread'
  });

  console.log('🔍 Top Funding Rate Opportunities\n');
  console.log('Symbol'.padEnd(15) + 'Spread'.padEnd(10) + 'APY');
  console.log('-'.repeat(35));

  for (const opp of opportunities) {
    const spreadPct = (opp.spread * 100).toFixed(3) + '%';
    const apy = (opp.spread * 3 * 365).toFixed(0) + '%'; // 3x daily, 365 days
    console.log(
      opp.symbol.padEnd(15) + 
      spreadPct.padEnd(10) + 
      apy
    );
  }
}

findOpportunities();
```

## Basic: Execute a Trade

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

async function executeTrade() {
  // 1. Find opportunities
  const { opportunities } = await client.getOpportunities({
    exchangepair: 'kucoin-bybit',
    limit: 1,
    sortby: 'spread'
  });

  const best = opportunities[0];
  
  if (!best || best.spread < 0.0003) {
    console.log('No good opportunities right now');
    return;
  }

  console.log(`Found: ${best.symbol} @ ${(best.spread * 100).toFixed(3)}% spread`);

  // 2. Execute
  const result = await client.executeOpportunity({
    opportunity_id: best.id,
    amount: 100,
    mode: 'grid'
  });

  console.log(`✅ Position opened: ${result.execution_id}`);
}

executeTrade();
```

## Basic: Monitor Portfolio

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

async function monitorPortfolio() {
  const portfolio = await client.getPortfolio();

  console.log('📊 Portfolio Summary');
  console.log(`Total PnL: $${portfolio.summary.total_unrealized_pnl.toFixed(2)}`);
  console.log(`ROI: ${(portfolio.summary.weighted_roi * 100).toFixed(2)}%`);
  console.log(`Notional: $${portfolio.summary.total_notional.toFixed(2)}`);
  
  console.log('\n📈 Open Positions');
  for (const exec of portfolio.executions) {
    const status = exec.pnl >= 0 ? '🟢' : '🔴';
    console.log(`${status} ${exec.symbol}: $${exec.pnl.toFixed(2)} (${exec.roi.toFixed(2)}%)`);
  }
}

// Run every 30 seconds
setInterval(monitorPortfolio, 30000);
monitorPortfolio();
```

## Intermediate: With Error Handling

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

async function safeExecute() {
  try {
    const { opportunities } = await client.getOpportunities({
      exchangepair: 'kucoin-bybit',
      limit: 5
    });

    if (opportunities.length === 0) {
      console.log('No opportunities available');
      return;
    }

    const best = opportunities[0];
    
    // Validate before executing
    if (best.spread < 0.0003) {
      console.log(`Spread too low: ${best.spread}`);
      return;
    }

    const result = await client.executeOpportunity({
      opportunity_id: best.id,
      amount: 100,
      mode: 'grid'
    });

    console.log('Success:', result);

  } catch (error) {
    if (error.code === 401) {
      console.error('Authentication failed - check your token');
    } else if (error.code === -32602) {
      console.error('Invalid parameters:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

safeExecute();
```

## Next

- [Strategy Engine Examples](/examples/strategy)
- [Full Agent Example](/examples/full-agent)
