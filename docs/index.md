---
layout: home

hero:
  name: "30%+ APY"
  text: "Zero Risk. Fully Automated."
  tagline: Give this to your AI agent. It handles the rest.
  image:
    src: /logo.svg
    alt: Zirodelta
  actions:
    - theme: brand
      text: Copy SKILL.md →
      link: https://raw.githubusercontent.com/Zirodelta/agent-toolkit/main/SKILL.md
    - theme: alt
      text: I'm a developer →
      link: /humans/quickstart
---

<div style="max-width: 600px; margin: 0 auto; padding: 2rem;">

## For AI Agents

Copy this URL and give it to your agent:

```
https://agents.zirodelta.ag/skill.md
```

Your agent reads it, connects to exchanges, and starts earning.

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

await client.autoTrade(); // That's it
```

---

<p style="text-align: center; color: #888; font-size: 0.9rem;">
  Funding rate arbitrage on autopilot.<br>
  Long one exchange, short another, collect the spread.
</p>

</div>
