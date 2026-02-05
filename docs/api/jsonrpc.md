# JSON-RPC API

Direct access to the Zirodelta backend via JSON-RPC.

## Endpoint

```
POST https://api.zirodelta.xyz/jsonrpc/
Content-Type: application/json
```

::: warning
Note the trailing slash — it's required!
:::

## Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

## Available Methods

### test

Health check / test endpoint.

```bash
curl -X POST https://api.zirodelta.xyz/jsonrpc/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"test","params":{},"id":1}'
```

### exchange_pair

List available exchange pairs.

```json
{
  "jsonrpc": "2.0",
  "method": "exchange_pair",
  "params": {},
  "id": 1
}
```

### get_opportunities

Get arbitrage opportunities.

```json
{
  "jsonrpc": "2.0",
  "method": "get_opportunities",
  "params": {
    "exchangepair": "kucoin-bybit",
    "limit": 10,
    "sortby": "spread"
  },
  "id": 1
}
```

### opportunity_detail

Get details for a specific opportunity.

```json
{
  "jsonrpc": "2.0",
  "method": "opportunity_detail",
  "params": {
    "opportunity_id": "opp_abc123"
  },
  "id": 1
}
```

### execute_opportunity *(auth required)*

Execute an arbitrage opportunity.

```json
{
  "jsonrpc": "2.0",
  "method": "execute_opportunity",
  "params": {
    "opportunity_id": "opp_abc123",
    "amount": 100,
    "mode": "grid"
  },
  "id": 1
}
```

### portfolio_live *(auth required)*

Get current portfolio.

```json
{
  "jsonrpc": "2.0",
  "method": "portfolio_live",
  "params": {},
  "id": 1
}
```

### close_execution *(auth required)*

Close a position.

```json
{
  "jsonrpc": "2.0",
  "method": "close_execution",
  "params": {
    "execution_id": "exec_xyz789"
  },
  "id": 1
}
```

### check_pair_status *(auth required)*

Check if a trading pair is active.

```json
{
  "jsonrpc": "2.0",
  "method": "check_pair_status",
  "params": {
    "exchangepair": "kucoin-bybit"
  },
  "id": 1
}
```

## Authentication

For authenticated endpoints, include the Bearer token:

```bash
curl -X POST https://api.zirodelta.xyz/jsonrpc/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"portfolio_live","params":{},"id":1}'
```

## Error Handling

JSON-RPC errors follow the standard format:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": { ... }
  },
  "id": 1
}
```

Common error codes:
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error
- `401` - Unauthorized (missing/invalid token)
