# Authentication

How to obtain and use tokens for the Zirodelta API.

## Authentication Flow

Zirodelta uses a two-step authentication:

1. **User Login** - Matrica OAuth (Web3 identity)
2. **Exchange Connection** - OAuth with Bybit/KuCoin

```
User → Matrica OAuth → JWT Token → Agent uses token
         ↓
    Exchange OAuth (Bybit/KuCoin) → Trading permissions
```

## Getting Your Token

### For Humans

1. Visit [zirodelta.ag](https://zirodelta.ag)
2. Click "Connect Wallet"
3. Authenticate with Matrica
4. Connect your exchange accounts
5. Copy your API token from the dashboard

### For Agents (Future)

Agent-specific authentication is coming:

```typescript
// Future API (not yet implemented)
const { token } = await client.authenticate({
  agentId: 'your-agent-id',
  apiKey: process.env.ZIRODELTA_AGENT_KEY
});
```

## Using the Token

### SDK

```typescript
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({
  token: process.env.ZIRODELTA_TOKEN
});
```

### CLI

```bash
export ZIRODELTA_TOKEN="your-token"
# or
zirodelta config set token your-token
```

### Direct API Calls

```bash
curl -X POST https://api.zirodelta.xyz/jsonrpc/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "portfolio_live",
    "params": {},
    "id": 1
  }'
```

## Token Security

::: warning
Never commit tokens to version control or share them publicly.
:::

Best practices:
- Store in environment variables
- Use secrets management (1Password, Vault, etc.)
- Rotate tokens periodically
- Use minimal required permissions

## Endpoints by Auth Requirement

### Public (No Auth)

| Method | Description |
|--------|-------------|
| `exchange_pair` | List available pairs |
| `get_opportunities` | Find opportunities |
| `opportunity_detail` | Get details |

### Authenticated

| Method | Description |
|--------|-------------|
| `execute_opportunity` | Open position |
| `portfolio_live` | View portfolio |
| `close_execution` | Close position |
| `check_pair_status` | Check pair status |
