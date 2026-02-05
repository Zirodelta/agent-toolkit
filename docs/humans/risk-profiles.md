# Risk Profiles

Understanding and choosing the right risk profile for your situation.

## Overview

The Strategy Engine supports three risk profiles that control position sizing, spread thresholds, and diversification.

## Conservative

Best for: Capital preservation, new users, large accounts.

```typescript
engine.setProfile({ riskProfile: 'conservative' });
```

| Setting | Value |
|---------|-------|
| Max position size | 20% of capital |
| Min spread | 0.05% |
| Max concurrent positions | 3 |
| Stop loss | 1% |

**Behavior:**
- Only takes high-confidence opportunities
- Smaller position sizes
- Prioritizes capital preservation
- Lower expected returns, lower risk

## Moderate (Default)

Best for: Most users, balanced approach.

```typescript
engine.setProfile({ riskProfile: 'moderate' });
```

| Setting | Value |
|---------|-------|
| Max position size | 30% of capital |
| Min spread | 0.03% |
| Max concurrent positions | 5 |
| Stop loss | 2% |

**Behavior:**
- Balanced risk/reward
- Medium position sizes
- Good diversification
- Suitable for most market conditions

## Aggressive

Best for: Experienced users, small accounts seeking growth.

```typescript
engine.setProfile({ riskProfile: 'aggressive' });
```

| Setting | Value |
|---------|-------|
| Max position size | 50% of capital |
| Min spread | 0.01% |
| Max concurrent positions | 10 |
| Stop loss | 3% |

**Behavior:**
- Maximizes capital deployment
- Takes more opportunities
- Higher potential returns
- Higher risk of drawdowns

## Comparison

| Aspect | Conservative | Moderate | Aggressive |
|--------|--------------|----------|------------|
| Expected daily return | 0.3-0.5% | 0.5-1.0% | 1.0-2.0% |
| Max drawdown risk | 2-3% | 5-7% | 10-15% |
| Opportunities taken | Few | Some | Many |
| Best market | Any | Normal | High volatility |

## Custom Profiles

Create your own profile:

```typescript
engine.setProfile({
  riskProfile: 'moderate', // Base
  // Override specific settings
  maxPositionSize: 25,
  minSpread: 0.04,
  maxOpenPositions: 4
});
```

## Recommendations

1. **Start conservative** - Learn the system before increasing risk
2. **Match to capital** - Smaller accounts may need aggressive to see returns
3. **Adjust to market** - Lower risk in uncertain conditions
4. **Never risk more than you can lose** - This is real money
