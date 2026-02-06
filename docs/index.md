---
layout: home

hero:
  name: "Earn 30%+ APY"
  text: "From Funding Rate Arbitrage"
  tagline: Delta-neutral. Fully automated. Built for AI agents.
  image:
    src: /logo.svg
    alt: Zirodelta
  actions:
    - theme: brand
      text: Get Started →
      link: /humans/
    - theme: alt
      text: Agent Docs →
      link: /agents/

features:
  - icon: 🎯
    title: "103% Avg ROI"
    details: Across 149 real trades on our live beta. $20k+ volume and counting.
  - icon: 🛡️
    title: Zero Directional Risk
    details: Go long on one exchange, short on another. Positions hedge each other. You collect the spread.
  - icon: 🤖
    title: Agent-Native
    details: TypeScript SDK, CLI, and SKILL.md docs designed for autonomous AI agents to trade without human intervention.
---

## How It Works

Funding rates are periodic payments between longs and shorts on perpetual futures. When rates differ across exchanges, that's free money.

### 3 Steps to Profit

**1. Connect your exchanges**
Link your Bybit and KuCoin accounts through Zirodelta. One API token, one config.

**2. Find rate spreads**
The engine scans for funding rate divergences across exchange pairs — and recommends the best opportunities based on your risk profile.

**3. Execute & earn**
Open hedged positions on both sides. Collect the spread every 8 hours. Close when the edge disappears.

### Example Spread

```
Bybit BTC/USDT:  +0.01% funding (longs pay shorts)
KuCoin BTC/USDT: -0.02% funding (shorts pay longs)
Spread: 0.03% per 8h = 0.09% daily = ~33% APY
```

By going **long on KuCoin** and **short on Bybit**, you receive funding on both sides while your directional exposure cancels out.

---

## The Toolkit

Everything you need to run funding rate arb — manually or autonomously.

| Tool | What it does |
|------|-------------|
| **TypeScript SDK** | Full-typed API client with IntelliSense. Find, execute, and manage positions programmatically. |
| **Strategy Engine** | Intelligent recommendations based on balance, risk profile, and daily targets. |
| **CLI** | Command-line interface for scripting and manual operation. |
| **TUI Dashboard** | Real-time terminal UI — positions, PnL, and opportunities at a glance. |
| **SKILL.md** | Agent-readable docs so AI can trade autonomously. |

---

## Quick Start

```bash
npm install zirodelta-agent-toolkit
```

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });

// Find the best funding rate spreads
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 5,
  sortby: 'spread'
});

// Execute a hedged position
await client.executeOpportunity({
  opportunity_id: opportunities[0].id,
  amount: 100
});
```

<p style="text-align: center; margin-top: 2rem;">
  <a href="/humans/quickstart">Full quickstart guide →</a> · <a href="/agents/">Build an autonomous agent →</a>
</p>
