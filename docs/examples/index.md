# Examples

## Copy & Run

### Find Opportunities

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient();

const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  sortby: 'spread'
});

for (const opp of opportunities) {
  console.log(`${opp.symbol}: ${(opp.spread * 100).toFixed(3)}%`);
}
```

---

### Execute Trade

```typescript
const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

// Get best opportunity
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 1
});

// Execute it
await client.executeOpportunity({
  opportunity_id: opportunities[0].id,
  amount: 100
});

console.log('✅ Position opened');
```

---

### Monitor & Close

```typescript
const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

// Check portfolio
const portfolio = await client.getPortfolio();
console.log(`PnL: $${portfolio.summary.total_unrealized_pnl}`);

// Close when profitable
for (const exec of portfolio.executions) {
  if (exec.roi > 0.05) {  // > 5% ROI
    await client.closeExecution({ execution_id: exec.id });
    console.log(`Closed ${exec.symbol} @ ${exec.roi}% ROI`);
  }
}
```

---

### Full Auto-Trading Loop

```typescript
const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

async function loop() {
  // Find
  const { opportunities } = await client.getOpportunities({
    exchangepair: 'kucoin-bybit'
  });

  // Trade if good
  const best = opportunities[0];
  if (best?.spread > 0.0005) {
    await client.executeOpportunity({
      opportunity_id: best.id,
      amount: 100
    });
  }

  // Check & close profitable
  const portfolio = await client.getPortfolio();
  for (const exec of portfolio.executions) {
    if (exec.roi > 0.05) {
      await client.closeExecution({ execution_id: exec.id });
    }
  }
}

// Run every 10 minutes
setInterval(loop, 10 * 60 * 1000);
loop();
```

---

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">

<a href="/examples/strategy" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>Strategy Engine →</strong><br>
  <span style="color: var(--vp-c-text-2);">Smart recommendations</span>
</a>

<a href="/examples/full-agent" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>Full Agent →</strong><br>
  <span style="color: var(--vp-c-text-2);">Production-ready code</span>
</a>

</div>
