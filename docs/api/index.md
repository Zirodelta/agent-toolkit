# API Reference

Complete reference for the Zirodelta Agent Toolkit SDK and JSON-RPC API.

## SDK Overview

```typescript
import { 
  ZirodeltaClient, 
  StrategyEngine,
  // Types
  Opportunity,
  Execution,
  Portfolio
} from 'zirodelta-agent-toolkit';
```

## ZirodeltaClient

Main client for interacting with the Zirodelta API.

### Constructor

```typescript
const client = new ZirodeltaClient({
  token?: string;       // Bearer token for authenticated requests
  baseUrl?: string;     // API base URL (default: https://api.zirodelta.xyz)
  timeout?: number;     // Request timeout in ms (default: 30000)
});
```

### Methods

#### getOpportunities()

Find arbitrage opportunities.

```typescript
const result = await client.getOpportunities({
  exchangepair: string;  // e.g., 'kucoin-bybit'
  limit?: number;        // Max results (default: 10)
  sortby?: 'spread' | 'volume' | 'symbol';
  minSpread?: number;    // Minimum spread filter
});

// Returns
interface GetOpportunitiesResult {
  opportunities: Opportunity[];
  timestamp: string;
}
```

#### getOpportunityDetail()

Get detailed information about an opportunity.

```typescript
const detail = await client.getOpportunityDetail({
  opportunity_id: string;
});
```

#### executeOpportunity()

Execute an arbitrage opportunity. **Requires authentication.**

```typescript
const result = await client.executeOpportunity({
  opportunity_id: string;
  amount: number;         // USD amount
  mode?: 'grid' | 'single-direct' | 'single-delay';
});

// Returns
interface ExecuteResult {
  execution_id: string;
  status: string;
  legs: ExecutionLeg[];
}
```

#### getPortfolio()

Get current portfolio and positions. **Requires authentication.**

```typescript
const portfolio = await client.getPortfolio();

// Returns
interface Portfolio {
  summary: {
    total_unrealized_pnl: number;
    weighted_roi: number;
    total_notional: number;
  };
  executions: ExecutionDetail[];
}
```

#### closeExecution()

Close a position. **Requires authentication.**

```typescript
await client.closeExecution({
  execution_id: string;
});
```

#### checkPairStatus()

Check if an exchange pair is active. **Requires authentication.**

```typescript
const status = await client.checkPairStatus({
  exchangepair: string;
});
```

## Types

### Opportunity

```typescript
interface Opportunity {
  id: string;
  symbol: string;
  exchangepair: string;
  spread: number;
  long_exchange: string;
  short_exchange: string;
  long_funding: number;
  short_funding: number;
  volume_24h: number;
  updated_at: string;
}
```

### Execution

```typescript
interface Execution {
  id: string;
  symbol: string;
  status: 'pending' | 'active' | 'closing' | 'closed';
  amount: number;
  entry_spread: number;
  current_spread: number;
  pnl: number;
  roi: number;
  opened_at: string;
}
```

## Next Steps

- [SDK Methods](/api/sdk) - Detailed method reference
- [JSON-RPC](/api/jsonrpc) - Direct API access
