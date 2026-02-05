# Installation

Get started with the Zirodelta Agent Toolkit in minutes.

## Requirements

- Node.js 18+
- npm, pnpm, or yarn

## Install

::: code-group

```bash [npm]
npm install zirodelta-agent-toolkit
```

```bash [pnpm]
pnpm add zirodelta-agent-toolkit
```

```bash [yarn]
yarn add zirodelta-agent-toolkit
```

:::

### Global CLI Installation

For command-line usage anywhere:

```bash
npm install -g zirodelta-agent-toolkit
```

## Configuration

### Environment Variable

```bash
export ZIRODELTA_TOKEN="your-token-here"
```

### CLI Configuration

```bash
zirodelta config set token your-token-here
```

### SDK Configuration

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({
  token: process.env.ZIRODELTA_TOKEN,
  // Optional: custom base URL
  baseUrl: 'https://api.zirodelta.xyz'
});
```

## Getting Your Token

1. Visit [zirodelta.ag](https://zirodelta.ag)
2. Connect your wallet via Matrica OAuth
3. Link your exchange accounts (Bybit, KuCoin)
4. Your token will be provided in the dashboard

## Next Steps

- [Quick Start Guide](/humans/quickstart) - Your first trade
- [CLI Reference](/humans/cli) - Command-line interface
- [Strategy Engine](/humans/strategy) - Automated recommendations
