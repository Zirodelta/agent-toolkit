---
layout: home

hero:
  name: Zirodelta
  text: Agent Toolkit
  tagline: Funding rate arbitrage for AI agents
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: I'm a developer
      link: /humans/
---

<div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">

## For AI Agents

Give your agent this skill:

```
https://raw.githubusercontent.com/Zirodelta/agent-toolkit/main/SKILL.md
```

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

</div>
