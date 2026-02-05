# Autonomous Agent Loop

Complete implementation for a self-running funding rate farming agent.

## Full Agent Example

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

class FundingRateAgent {
  private client: ZirodeltaClient;
  private engine: StrategyEngine;
  private running = false;

  constructor(token: string) {
    this.client = new ZirodeltaClient({ token });
    this.engine = new StrategyEngine(this.client);
  }

  configure(options: {
    balances: Record<string, number>;
    dailyTarget: number;
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
  }) {
    this.engine.setProfile({
      ...options,
      maxPositionSize: 30,
      maxOpenPositions: 5,
      minSpread: 0.03,
      exchanges: {
        bybit: { enabled: true },
        kucoin: { enabled: true }
      }
    });
  }

  async run() {
    this.running = true;
    console.log('🤖 Agent started');

    while (this.running) {
      try {
        await this.cycle();
        await this.sleep(60000); // 1 minute between cycles
      } catch (error) {
        console.error('Cycle error:', error);
        await this.sleep(300000); // 5 min backoff on error
      }
    }
  }

  private async cycle() {
    // 1. Check current portfolio
    const portfolio = await this.client.getPortfolio();
    const currentROI = portfolio.summary.weighted_roi;
    
    console.log(`📊 Current ROI: ${(currentROI * 100).toFixed(2)}%`);

    // 2. Check if daily target reached
    if (currentROI >= this.engine.profile.dailyTarget / 100) {
      console.log('🎯 Daily target reached! Closing positions...');
      await this.closeAll(portfolio);
      return;
    }

    // 3. Check for negative positions to close
    for (const exec of portfolio.executions) {
      if (exec.roi < -0.02) { // -2% stop loss
        console.log(`🛑 Stop loss triggered for ${exec.symbol}`);
        await this.client.closeExecution({ 
          execution_id: exec.execution.id 
        });
      }
    }

    // 4. Look for new opportunities
    const openCount = portfolio.executions.length;
    if (openCount < this.engine.profile.maxOpenPositions) {
      const recs = await this.engine.getRecommendations();
      
      if (recs.opportunities.length > 0) {
        const best = recs.opportunities[0];
        console.log(`💰 Executing: ${best.symbol} @ ${best.spread}% spread`);
        
        await this.client.executeOpportunity({
          opportunity_id: best.id,
          amount: best.recommendedAmount,
          mode: 'grid'
        });
      }
    }
  }

  private async closeAll(portfolio: any) {
    for (const exec of portfolio.executions) {
      await this.client.closeExecution({
        execution_id: exec.execution.id
      });
    }
  }

  stop() {
    this.running = false;
    console.log('🛑 Agent stopped');
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const agent = new FundingRateAgent(process.env.ZIRODELTA_TOKEN!);

agent.configure({
  balances: { bybit: 1000, kucoin: 1000 },
  dailyTarget: 1.0, // 1% daily
  riskProfile: 'moderate'
});

agent.run();

// Graceful shutdown
process.on('SIGINT', () => agent.stop());
```

## OpenClaw Integration

For agents running in OpenClaw:

```typescript
// In your agent's execution loop
import { ZirodeltaClient } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ 
  token: process.env.ZIRODELTA_TOKEN 
});

// Check opportunities
const { opportunities } = await client.getOpportunities({
  exchangepair: 'kucoin-bybit',
  limit: 5
});

// Report to main session
if (opportunities[0]?.spread > 0.05) {
  console.log(`🔥 High spread alert: ${opportunities[0].symbol} @ ${opportunities[0].spread}%`);
}
```

## Cron-Based Execution

Run checks on a schedule:

```javascript
// cron job config for OpenClaw
{
  "schedule": { "kind": "every", "everyMs": 3600000 }, // hourly
  "payload": { 
    "kind": "agentTurn", 
    "message": "Check funding rate opportunities and execute if profitable"
  }
}
```
