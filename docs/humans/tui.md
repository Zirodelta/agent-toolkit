# TUI Dashboard

Real-time terminal interface for monitoring.

## Launch

```bash
zirodelta tui
```

Or programmatically:

```typescript
import { launchTUI } from 'zirodelta-agent-toolkit';

launchTUI({
  token: process.env.ZIRODELTA_TOKEN,
  refreshInterval: 30000
});
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh |
| `o` | View opportunities |
| `p` | View portfolio |
| `↑/↓` | Navigate |
| `Enter` | Select/Execute |
| `c` | Close selected position |
| `?` | Help |

## Views

### Opportunities View

Shows real-time arbitrage opportunities:

```
┌─────────────────────────────────────────────────────┐
│ OPPORTUNITIES                      [kucoin-bybit]   │
├─────────────────────────────────────────────────────┤
│ Symbol        Spread    Long FR    Short FR    APY  │
│ BTC/USDT      0.045%    -0.010%    +0.035%    49%  │
│ ETH/USDT      0.038%    -0.008%    +0.030%    41%  │
│ SOL/USDT      0.032%    -0.012%    +0.020%    35%  │
└─────────────────────────────────────────────────────┘
```

### Portfolio View

Shows your current positions:

```
┌─────────────────────────────────────────────────────┐
│ PORTFOLIO                    Total PnL: +$45.23     │
├─────────────────────────────────────────────────────┤
│ Symbol        Amount    Entry     Current    ROI    │
│ BTC/USDT      $500      0.032%    0.028%    +2.3%  │
│ ETH/USDT      $300      0.028%    0.031%    +1.8%  │
├─────────────────────────────────────────────────────┤
│ Summary: 2 positions, $800 notional, 2.1% avg ROI   │
└─────────────────────────────────────────────────────┘
```

## Configuration

Create `~/.zirodelta/tui.json`:

```json
{
  "refreshInterval": 30000,
  "theme": "dark",
  "defaultPair": "kucoin-bybit",
  "showNotifications": true
}
```

## Tips

1. **Quick Execute**: Press `e` on any opportunity to execute with default amount
2. **Watchlist**: Press `w` to add symbol to watchlist
3. **Alerts**: Configure spread alerts in settings
4. **Export**: Press `x` to export portfolio to CSV
