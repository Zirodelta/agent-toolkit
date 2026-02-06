# API Reference

## Quick Setup

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});
```

---

## Methods

### Find Opportunities (no auth needed)

```typescript
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',  // required
  limit: 10,                      // optional
  sortby: 'spread'                // optional
});
```

### Execute Trade (auth required)

```typescript
await client.executeOpportunity({
  opportunity_id: 'opp_123',
  amount: 100  // USD
});
```

### Check Portfolio (auth required)

```typescript
const portfolio = await client.getPortfolio();
// → { summary, executions }
```

### Close Position (auth required)

```typescript
await client.closeExecution({
  execution_id: 'exec_456'
});
```

---

## Response Types

### Opportunity

```typescript
{
  id: string,
  symbol: string,        // "BTC-USDT"
  spread: number,        // 0.0003 = 0.03%
  long_exchange: string,
  short_exchange: string
}
```

### Portfolio

```typescript
{
  summary: {
    total_unrealized_pnl: number,
    weighted_roi: number
  },
  executions: Execution[]
}
```

---

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">

<a href="/api/sdk" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>Full SDK Docs →</strong><br>
  <span style="color: var(--vp-c-text-2);">All methods & options</span>
</a>

<a href="/api/jsonrpc" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>JSON-RPC →</strong><br>
  <span style="color: var(--vp-c-text-2);">Direct API access</span>
</a>

</div>
