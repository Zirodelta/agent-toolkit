# Full Agent Example

Complete autonomous funding rate farming agent.

## The Code

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

interface AgentConfig {
  token: string;
  balances: Record<string, number>;
  dailyTarget: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  checkIntervalMs: number;
  stopLossPercent: number;
}

class FundingRateAgent {
  private client: ZirodeltaClient;
  private engine: StrategyEngine;
  private config: AgentConfig;
  private running = false;
  private dailyPnL = 0;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new ZirodeltaClient({ token: config.token });
    this.engine = new StrategyEngine(this.client);
    
    this.engine.setProfile({
      balances: config.balances,
      riskProfile: config.riskProfile,
      dailyTarget: config.dailyTarget,
      maxPositionSize: 30,
      maxOpenPositions: 5,
      minSpread: 0.03
    });
  }

  async start() {
    this.running = true;
    this.log('🚀 Agent starting...');
    
    // Reset daily PnL at midnight
    this.scheduleDailyReset();
    
    while (this.running) {
      try {
        await this.runCycle();
      } catch (error) {
        this.log(`❌ Error: ${error.message}`);
      }
      
      await this.sleep(this.config.checkIntervalMs);
    }
  }

  stop() {
    this.running = false;
    this.log('🛑 Agent stopped');
  }

  private async runCycle() {
    // 1. Get current portfolio
    const portfolio = await this.client.getPortfolio();
    const currentROI = portfolio.summary.weighted_roi * 100;
    
    this.log(`📊 Portfolio: $${portfolio.summary.total_unrealized_pnl.toFixed(2)} (${currentROI.toFixed(2)}%)`);

    // 2. Check daily target
    if (this.dailyPnL >= this.config.dailyTarget) {
      this.log('🎯 Daily target reached!');
      await this.closeAllPositions(portfolio);
      return;
    }

    // 3. Manage existing positions
    await this.managePositions(portfolio);

    // 4. Open new positions if room
    if (portfolio.executions.length < 5) {
      await this.openNewPositions();
    }
  }

  private async managePositions(portfolio: any) {
    for (const exec of portfolio.executions) {
      // Stop loss
      if (exec.roi < -this.config.stopLossPercent) {
        this.log(`🛑 Stop loss: ${exec.symbol} @ ${exec.roi.toFixed(2)}%`);
        await this.client.closeExecution({ execution_id: exec.execution.id });
        continue;
      }

      // Take profit at 5%
      if (exec.roi > 5) {
        this.log(`💰 Take profit: ${exec.symbol} @ ${exec.roi.toFixed(2)}%`);
        await this.client.closeExecution({ execution_id: exec.execution.id });
        this.dailyPnL += exec.pnl;
      }
    }
  }

  private async openNewPositions() {
    const recs = await this.engine.getRecommendations();
    
    if (recs.opportunities.length === 0) {
      this.log('😴 No opportunities above threshold');
      return;
    }

    const best = recs.opportunities[0];
    this.log(`💡 Opening: ${best.symbol} @ ${best.spread}% spread, $${best.recommendedAmount}`);

    await this.client.executeOpportunity({
      opportunity_id: best.id,
      amount: best.recommendedAmount,
      mode: 'grid'
    });
  }

  private async closeAllPositions(portfolio: any) {
    for (const exec of portfolio.executions) {
      await this.client.closeExecution({ execution_id: exec.execution.id });
      this.dailyPnL += exec.pnl;
    }
    this.log(`📈 Day closed with $${this.dailyPnL.toFixed(2)} PnL`);
  }

  private scheduleDailyReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.dailyPnL = 0;
      this.log('🌅 Daily PnL reset');
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  private log(message: string) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${message}`);
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============ USAGE ============

const agent = new FundingRateAgent({
  token: process.env.ZIRODELTA_TOKEN!,
  balances: { bybit: 1000, kucoin: 1000 },
  dailyTarget: 1.0,  // 1% daily
  riskProfile: 'moderate',
  checkIntervalMs: 60000,  // Check every minute
  stopLossPercent: 2  // 2% stop loss
});

// Start
agent.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  agent.stop();
  process.exit(0);
});
```

## Running the Agent

```bash
# Set token
export ZIRODELTA_TOKEN="your-token"

# Run
npx ts-node agent.ts

# Or with pm2 for production
pm2 start agent.ts --name "funding-agent"
```

## Monitoring

The agent logs to stdout. For production, pipe to a file or use pm2 logs:

```bash
pm2 logs funding-agent
```
