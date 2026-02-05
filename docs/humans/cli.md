# CLI Reference

Command-line interface for manual operation and scripting.

## Installation

```bash
npm install -g zirodelta-agent-toolkit
```

## Configuration

```bash
# Set your token
zirodelta config set token your-token-here

# View config
zirodelta config show
```

## Commands

### opportunities

Find arbitrage opportunities across exchange pairs.

```bash
zirodelta opportunities [options]

Options:
  -p, --pair <pair>     Exchange pair (e.g., kucoin-bybit)
  -l, --limit <n>       Number of results (default: 10)
  -s, --sort <field>    Sort by: spread, volume, symbol
  --min-spread <n>      Minimum spread filter
  --json                Output as JSON
```

**Examples:**

```bash
# Top 10 opportunities
zirodelta opportunities --pair kucoin-bybit

# Filter by minimum spread
zirodelta opportunities --pair kucoin-bybit --min-spread 0.05

# JSON output for scripting
zirodelta opportunities --json | jq '.opportunities[0]'
```

### execute

Execute an arbitrage opportunity.

```bash
zirodelta execute <opportunity_id> [options]

Options:
  -a, --amount <usd>    Amount in USD (required)
  -m, --mode <mode>     Execution mode: grid, single-direct, single-delay
  --dry-run             Simulate without executing
```

**Examples:**

```bash
# Execute with $100
zirodelta execute opp_abc123 --amount 100

# Dry run first
zirodelta execute opp_abc123 --amount 100 --dry-run
```

### portfolio

View your current positions and PnL.

```bash
zirodelta portfolio [options]

Options:
  --json                Output as JSON
  --watch               Refresh every 30s
```

### close

Close an execution.

```bash
zirodelta close <execution_id> [options]

Options:
  -f, --force           Close without confirmation
  --all                 Close all positions
```

### monitor

Real-time monitoring dashboard.

```bash
zirodelta monitor [options]

Options:
  -i, --interval <s>    Refresh interval in seconds (default: 30)
```

### tui

Launch the interactive TUI dashboard.

```bash
zirodelta tui
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ZIRODELTA_TOKEN` | Your API token |
| `ZIRODELTA_API_URL` | Custom API URL (optional) |
