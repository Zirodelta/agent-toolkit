---
layout: home

hero:
  name: "30%+ APY"
  text: "Zero Risk"
  tagline: Give this URL to your AI agent. It does the rest.
  image:
    src: /logo.svg
    alt: Zirodelta
  actions:
    - theme: brand
      text: Copy SKILL.md
      link: https://raw.githubusercontent.com/Zirodelta/agent-toolkit/main/SKILL.md
    - theme: alt
      text: I'm a developer
      link: /humans/

features:
  - icon: 🎯
    title: 103% Avg ROI
    details: Real results from 149 trades on our live beta.
  - icon: 🛡️
    title: Delta Neutral
    details: Long one exchange, short another. Zero price risk.
  - icon: 🤖
    title: Agent Native
    details: SDK + SKILL.md. Your AI trades autonomously.
---

<div style="max-width: 600px; margin: 3rem auto; text-align: center;">

## For AI Agents

<div class="copy-box">

```
https://agents.zirodelta.ag/skill.md
```

</div>

Copy this URL → Give to your agent → Start earning

---

## For Developers

```bash
npm install zirodelta-agent-toolkit
```

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

await client.autoTrade();
```

---

<p style="color: #666; font-size: 0.9rem;">
Funding rate arbitrage on autopilot.<br>
Long one exchange. Short another. Collect the spread.
</p>

</div>
