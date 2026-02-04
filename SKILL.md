# Zirodelta Agent Skill

Agent-native infrastructure for autonomous funding rate farming.

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

## Quick Start

### Using the SDK

```typescript
import { ZirodeltaClient } from '@zirodelta/agent-toolkit';

const client = new ZirodeltaClient({
  token: process.env.ZIRODELTA_TOKEN
});

// Find opportunities
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 5,
  sortby: 'spread'
});

// Execute best opportunity
const best = opportunities[0];
if (best.spread > 0.005) {  // > 0.5% spread
  await client.executeOpportunity({
    opportunity_id: best.id,
    amount: 100  // $100 USD
  });
}

// Monitor portfolio
const portfolio = await client.getPortfolio();
console.log('Total PnL:', portfolio.summary.total_unrealized_pnl);

// Close when target reached
if (portfolio.summary.weighted_roi > 0.05) {  // > 5% ROI
  for (const exec of portfolio.executions) {
    await client.closeExecution({ 
      execution_id: exec.execution.id 
    });
  }
}
```

### Using the CLI

```bash
# Set token
export ZIRODELTA_TOKEN="your-token"

# Or configure
zirodelta config set token your-token

# Find opportunities
zirodelta opportunities --pair kucoin-bybit --limit 10

# Execute
zirodelta execute opp_abc123 --amount 100

# Check portfolio
zirodelta portfolio

# Monitor real-time
zirodelta monitor --interval 30

# Close position
zirodelta close exec_xyz789 --force
```

## API Reference

### Base URL
```
https://api.zirodelta.com/api/v1
```

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer <token>
```

### JSON-RPC Endpoint
```
POST /api/v1/jsonrpc/
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

### Methods

#### `get_opportunities`
Get arbitrage opportunities.

**Params:**
- `exchangepair` (required): Exchange pair (e.g., "kucoin-bybit")
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `q`: Symbol filter
- `sortby`: Sort field (spread, risk_score, liquidity_score)

**Response:**
```json
{
  "opportunities": [
    {
      "id": "opp_123",
      "symbol": "BTCUSDT",
      "long_exchange": "kucoin",
      "short_exchange": "bybit",
      "long_funding_rate": -0.02,
      "short_funding_rate": 0.01,
      "spread": 0.03,
      "next_funding_time": "2024-01-15T08:00:00Z",
      "risk_score": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### `execute_opportunity`
Execute an arbitrage trade. **Requires auth.**

**Params:**
- `opportunity_id` (required): Opportunity ID
- `amount` (required): USD amount to trade
- `mode`: "auto" or "manual" (default: "auto")

**Response:**
```json
{
  "success": true,
  "job_id": "job_456",
  "execution_id": "exec_789",
  "message": "Execution queued"
}
```

#### `portfolio_live`
Get live portfolio data. **Requires auth.**

**Params:**
- `execution_id`: Filter by specific execution (optional)

**Response:**
```json
{
  "executions": [
    {
      "execution": {
        "id": "exec_789",
        "symbol": "BTCUSDT",
        "status": "running",
        "input_amount": 100
      },
      "pnl": {
        "unrealized_pnl": 2.50,
        "total_pnl_pct": 2.5
      },
      "funding": {
        "net_funding": 1.20
      }
    }
  ],
  "summary": {
    "total_invested": 100,
    "total_unrealized_pnl": 2.50,
    "weighted_roi": 2.5
  }
}
```

#### `close_execution`
Close a running execution. **Requires auth.**

**Params:**
- `execution_id` (required): Execution ID

**Response:**
```json
{
  "success": true,
  "execution_id": "exec_789",
  "final_pnl": 3.50,
  "final_roi_pct": 3.5,
  "total_funding": 2.00,
  "duration_hours": 24.5
}
```

## Agent Workflows

### Autonomous Farming Loop

```typescript
async function farmingLoop(client: ZirodeltaClient) {
  while (true) {
    // 1. Check portfolio
    const portfolio = await client.getPortfolio();
    
    // 2. Close profitable positions (> 5% ROI)
    for (const exec of portfolio.executions) {
      if (exec.pnl.total_pnl_pct > 5) {
        await client.closeExecution({ 
          execution_id: exec.execution.id 
        });
      }
    }
    
    // 3. Find new opportunities if under allocation
    if (portfolio.summary.total_invested < 1000) {
      const { opportunities } = await client.getOpportunities({
        exchangepair: 'kucoin-bybit',
        limit: 5,
        sortby: 'spread'
      });
      
      // 4. Execute high-spread, low-risk opportunities
      for (const opp of opportunities) {
        if (opp.spread > 0.005 && opp.risk_score <= 3) {
          await client.executeOpportunity({
            opportunity_id: opp.id,
            amount: 100
          });
          break;  // One at a time
        }
      }
    }
    
    // 5. Wait before next iteration
    await sleep(60 * 1000);  // 1 minute
  }
}
```

### Risk Management Rules

1. **Position Sizing**: Never put > 10% of capital in single position
2. **Spread Threshold**: Only enter if spread > 0.3% (annualized > 10%)
3. **Risk Score**: Prefer opportunities with risk_score ≤ 3
4. **Duration**: Close after 24-48h to avoid funding rate reversals
5. **Diversification**: Max 3 positions per symbol

### Decision Criteria

| Metric | Good | Okay | Avoid |
|--------|------|------|-------|
| Spread | > 0.5% | 0.3-0.5% | < 0.3% |
| Risk Score | 1-3 | 4-6 | 7-10 |
| Liquidity | High | Medium | Low |
| Time to Funding | < 4h | 4-8h | > 8h |

## Exchange Pairs

| Pair | Long Exchange | Short Exchange |
|------|---------------|----------------|
| kucoin-bybit | KuCoin | Bybit |
| bybit-kucoin | Bybit | KuCoin |
| hyperliquid-bybit | HyperLiquid | Bybit |
| bybit-hyperliquid | Bybit | HyperLiquid |

## Error Handling

```typescript
import { 
  ZirodeltaError, 
  AuthenticationError, 
  RateLimitError 
} from '@zirodelta/agent-toolkit';

try {
  await client.executeOpportunity({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Token invalid/expired - re-authenticate
  } else if (error instanceof RateLimitError) {
    // Wait and retry
    await sleep(error.retryAfter * 1000);
  } else if (error instanceof ZirodeltaError) {
    // Handle specific error codes
    console.error(error.code, error.message);
  }
}
```

## Best Practices

1. **Always check portfolio before executing** - avoid duplicate positions
2. **Use dry-run in development** - `--dry-run` flag in CLI
3. **Monitor funding rates** - they can flip; close before reversal
4. **Set stop-loss mentally** - close if PnL drops below -3%
5. **Respect rate limits** - don't poll more than 1x/minute
