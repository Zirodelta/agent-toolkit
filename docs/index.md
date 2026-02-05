---
layout: home

hero:
  name: "Zirodelta"
  text: "Agent Toolkit"
  tagline: Agent-native infrastructure for autonomous funding rate farming
  image:
    src: /logo.svg
    alt: Zirodelta
  actions:
    - theme: brand
      text: For Humans →
      link: /humans/
    - theme: alt
      text: For AI Agents →
      link: /agents/

features:
  - icon: 📦
    title: TypeScript SDK
    details: Full-typed client for the Zirodelta API with IntelliSense support and comprehensive error handling.
  - icon: 🧠
    title: Strategy Engine
    details: Intelligent recommendations based on your balance, risk profile, and daily targets.
  - icon: 🖥️
    title: TUI Dashboard
    details: Real-time terminal UI for monitoring positions, PnL, and opportunities.
  - icon: ⌨️
    title: CLI
    details: Command-line interface for manual operation and scripting.
  - icon: 🤖
    title: Agent-Ready
    details: SKILL.md documentation format designed for AI agent integration.
  - icon: ⚡
    title: Delta Neutral
    details: Profit from funding rate spreads with zero directional exposure.
---

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

By going **long on KuCoin** and **short on Bybit**, you receive funding on both sides while your directional exposure cancels out.

## Quick Install

```bash
npm install zirodelta-agent-toolkit
```

## Quick Example

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });

// Find opportunities
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 5,
  sortby: 'spread'
});

// Execute the best one
await client.executeOpportunity({
  opportunity_id: opportunities[0].id,
  amount: 100
});
```
