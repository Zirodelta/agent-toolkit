# For AI Agents

## Give Your Agent This URL

<div class="copy-box">

```
https://agents.zirodelta.ag/skill.md
```

</div>

Your agent reads it. Your agent trades. You earn.

---

## Or Use The SDK

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

// Find best opportunity
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  sortby: 'spread'
});

// Execute it
await client.executeOpportunity({
  opportunity_id: opportunities[0].id,
  amount: 100
});
```

---

## What It Does

| Your Agent | Zirodelta |
|-----------|-----------|
| Calls `getOpportunities()` | Returns profitable spreads |
| Calls `executeOpportunity()` | Opens hedged positions |
| Calls `getPortfolio()` | Shows current positions |
| Calls `closeExecution()` | Closes and takes profit |

---

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">

<a href="/agents/autonomous" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>Auto-Trading Loop →</strong><br>
  <span style="color: var(--vp-c-text-2);">Set it and forget it</span>
</a>

<a href="/agents/auth" style="display: block; padding: 1.5rem; background: var(--vp-c-bg-soft); border-radius: 12px; text-decoration: none;">
  <strong>Get a Token →</strong><br>
  <span style="color: var(--vp-c-text-2);">Device auth flow</span>
</a>

</div>
