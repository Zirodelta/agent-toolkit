# SDK Methods

Detailed reference for all ZirodeltaClient methods.

## Constructor

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient(options?: ClientOptions);
```

### ClientOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `token` | `string` | - | Bearer token for auth |
| `baseUrl` | `string` | `https://api.zirodelta.xyz` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |

## Methods

### getOpportunities()

Fetch arbitrage opportunities.

```typescript
const result = await client.getOpportunities(params: GetOpportunitiesParams);
```

**Parameters:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `exchangepair` | `string` | Yes | Exchange pair (e.g., `kucoin-bybit`) |
| `limit` | `number` | No | Max results (default: 10) |
| `sortby` | `string` | No | Sort field: `spread`, `volume`, `symbol` |
| `minSpread` | `number` | No | Minimum spread filter |

**Returns:** `Promise<{ opportunities: Opportunity[], timestamp: string }>`

---

### getOpportunityDetail()

Get detailed info for a specific opportunity.

```typescript
const detail = await client.getOpportunityDetail(params: { opportunity_id: string });
```

**Returns:** `Promise<OpportunityDetail>`

---

### executeOpportunity()

Execute an arbitrage trade. **Requires authentication.**

```typescript
const result = await client.executeOpportunity(params: ExecuteParams);
```

**Parameters:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `opportunity_id` | `string` | Yes | Opportunity to execute |
| `amount` | `number` | Yes | USD amount |
| `mode` | `string` | No | `grid` (default), `single-direct`, `single-delay` |

**Returns:** `Promise<ExecuteResult>`

---

### getPortfolio()

Get current portfolio and positions. **Requires authentication.**

```typescript
const portfolio = await client.getPortfolio();
```

**Returns:** `Promise<Portfolio>`

```typescript
interface Portfolio {
  summary: {
    total_unrealized_pnl: number;
    weighted_roi: number;
    total_notional: number;
  };
  executions: ExecutionDetail[];
}
```

---

### closeExecution()

Close a position. **Requires authentication.**

```typescript
await client.closeExecution(params: { execution_id: string });
```

---

### checkPairStatus()

Check if an exchange pair is active. **Requires authentication.**

```typescript
const status = await client.checkPairStatus(params: { exchangepair: string });
```

**Returns:** `Promise<{ active: boolean, lastUpdate: string }>`

---

### resubmitExecution()

Retry a failed execution. **Requires authentication.**

```typescript
const result = await client.resubmitExecution(params: { execution_id: string });
```

---

### continueEpoch()

Continue to the next funding epoch. **Requires authentication.**

```typescript
await client.continueEpoch(params: { execution_id: string });
```

## Error Handling

All methods throw `ZirodeltaError` on failure:

```typescript
try {
  await client.executeOpportunity({ ... });
} catch (error) {
  if (error instanceof ZirodeltaError) {
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
  }
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `401` | Unauthorized - invalid/missing token |
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid parameters |
| `-32603` | Internal error |
