# Strategy Engine Examples

Using the intelligent recommendation system.

## Basic Strategy Setup

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });
const engine = new StrategyEngine(client);

// Configure your profile
engine.setProfile({
  balances: { 
    bybit: 1000, 
    kucoin: 1000 
  },
  riskProfile: 'moderate',
  dailyTarget: 1.0,
  maxPositionSize: 30,
  maxOpenPositions: 5,
  minSpread: 0.03,
  exchanges: {
    bybit: { enabled: true },
    kucoin: { enabled: true }
  }
});

// Get recommendations
const recs = await engine.getRecommendations();

console.log('📋 Recommendations:');
for (const opp of recs.opportunities) {
  console.log(`  ${opp.symbol}: $${opp.recommendedAmount} @ ${opp.spread}%`);
}
console.log(`\nExpected daily return: ${recs.expectedDailyReturn}%`);
```

## Risk Profile Comparison

```typescript
import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';

const client = new ZirodeltaClient({ token: process.env.ZIRODELTA_TOKEN });

const profiles = ['conservative', 'moderate', 'aggressive'] as const;

for (const profile of profiles) {
  const engine = new StrategyEngine(client);
  
  engine.setProfile({
    balances: { bybit: 1000, kucoin: 1000 },
    riskProfile: profile,
    dailyTarget: 1.0
  });

  const recs = await engine.getRecommendations();
  
  console.log(`\n${profile.toUpperCase()}:`);
  console.log(`  Positions: ${recs.opportunities.length}`);
  console.log(`  Total allocation: $${recs.totalAllocation}`);
  console.log(`  Expected return: ${recs.expectedDailyReturn}%`);
}
```

## Dynamic Balance Updates

```typescript
const engine = new StrategyEngine(client);

// Initial setup
engine.setProfile({
  balances: { bybit: 1000, kucoin: 1000 },
  riskProfile: 'moderate'
});

// After a trade executes, update balances
engine.updateBalances({
  bybit: 900,  // Used $100
  kucoin: 900
});

// Get new recommendations with updated balances
const recs = await engine.getRecommendations();
```

## Filtering by Exchange

```typescript
engine.setProfile({
  balances: { bybit: 2000 },
  riskProfile: 'moderate',
  exchanges: {
    bybit: { enabled: true },
    kucoin: { enabled: false }  // Disabled
  }
});

// Only gets recommendations for Bybit
const recs = await engine.getRecommendations();
```

## Custom Spread Thresholds

```typescript
// Conservative: only high-spread opportunities
engine.setProfile({
  minSpread: 0.05,  // 0.05% minimum
  // ...
});

// Aggressive: accept lower spreads for more trades
engine.setProfile({
  minSpread: 0.01,  // 0.01% minimum
  // ...
});
```
