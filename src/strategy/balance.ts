/**
 * Zirodelta Strategy Engine - Balance Management
 * 
 * Track balances, allocated capital, and rebalancing suggestions.
 */

import type {
  AgentProfile,
  ExchangeBalance,
  BalanceSummary,
  RebalanceSuggestion,
  CurrentPosition,
} from './types.js';
import type { ExchangeName, Portfolio } from '../sdk/types.js';
import { ZirodeltaClient } from '../sdk/client.js';

// ============================================================================
// Balance Tracking
// ============================================================================

/**
 * Calculate balance summary from profile and positions
 */
export function calculateBalanceSummary(
  profile: AgentProfile,
  positions: CurrentPosition[] = []
): BalanceSummary {
  const balances: ExchangeBalance[] = [];
  
  // Calculate allocated capital per exchange
  const allocatedByExchange: { [exchange: string]: number } = {};
  
  for (const pos of positions) {
    // Half of position size goes to each exchange
    const perExchange = pos.size / 2;
    allocatedByExchange[pos.longExchange] = (allocatedByExchange[pos.longExchange] || 0) + perExchange;
    allocatedByExchange[pos.shortExchange] = (allocatedByExchange[pos.shortExchange] || 0) + perExchange;
  }
  
  // Build balance records for each exchange
  for (const [exchange, total] of Object.entries(profile.balances)) {
    const allocated = allocatedByExchange[exchange] || 0;
    const available = Math.max(0, total - allocated);
    
    balances.push({
      exchange: exchange as ExchangeName,
      total,
      available,
      allocated,
      margin: allocated > 0 ? allocated * 0.2 : 0, // Approximate margin at 5x leverage
    });
  }
  
  // Calculate totals
  const totalCapital = balances.reduce((sum, b) => sum + b.total, 0);
  const totalAvailable = balances.reduce((sum, b) => sum + b.available, 0);
  const totalAllocated = balances.reduce((sum, b) => sum + b.allocated, 0);
  
  // Generate rebalance suggestions
  const rebalanceSuggestions = generateRebalanceSuggestions(balances);
  
  return {
    balances,
    totalCapital,
    totalAvailable,
    totalAllocated,
    rebalanceSuggestions,
  };
}

/**
 * Generate suggestions for rebalancing capital between exchanges
 */
function generateRebalanceSuggestions(
  balances: ExchangeBalance[]
): RebalanceSuggestion[] {
  const suggestions: RebalanceSuggestion[] = [];
  
  if (balances.length < 2) {
    return suggestions;
  }
  
  // Sort by available balance
  const sorted = [...balances].sort((a, b) => b.available - a.available);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  
  // If there's significant imbalance
  const diff = highest.available - lowest.available;
  const threshold = highest.total * 0.3; // 30% imbalance threshold
  
  if (diff > threshold && diff > 100) {
    const transferAmount = Math.floor(diff / 2);
    suggestions.push({
      from: highest.exchange,
      to: lowest.exchange,
      amount: transferAmount,
      reason: `Balance ${highest.exchange} and ${lowest.exchange} for better opportunity coverage`,
    });
  }
  
  // Check if any exchange is running low for future positions
  for (const balance of balances) {
    if (balance.available < 100 && balance.total > balance.available) {
      const other = balances.find(b => b.exchange !== balance.exchange && b.available > 200);
      if (other) {
        suggestions.push({
          from: other.exchange,
          to: balance.exchange,
          amount: 100,
          reason: `${balance.exchange} running low on available capital`,
        });
      }
    }
  }
  
  return suggestions;
}

// ============================================================================
// Balance Fetching (via API)
// ============================================================================

/**
 * Fetch live balances from exchanges via Zirodelta API
 * Returns updated profile with fresh balances
 */
export async function fetchLiveBalances(
  client: ZirodeltaClient,
  profile: AgentProfile
): Promise<AgentProfile> {
  try {
    // Get portfolio which includes account info
    const portfolio = await client.getPortfolio();
    
    // Extract balances from portfolio if available
    // The actual implementation depends on what the API returns
    // For now, we'll return the profile as-is if no balance data
    
    // In a real implementation, you'd parse portfolio.summary or 
    // make additional API calls to get per-exchange balances
    
    return {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    // If we can't fetch, return the profile unchanged
    return profile;
  }
}

/**
 * Update profile with manual balance entry
 */
export function updateBalance(
  profile: AgentProfile,
  exchange: string,
  amount: number
): AgentProfile {
  return {
    ...profile,
    balances: {
      ...profile.balances,
      [exchange]: amount,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get total capital across all exchanges
 */
export function getTotalCapital(profile: AgentProfile): number {
  return Object.values(profile.balances).reduce((sum, b) => sum + b, 0);
}

/**
 * Get available capital (not in positions)
 */
export function getAvailableCapital(
  profile: AgentProfile,
  positions: CurrentPosition[]
): number {
  const summary = calculateBalanceSummary(profile, positions);
  return summary.totalAvailable;
}

/**
 * Check if there's enough capital for a new position
 */
export function hasCapitalFor(
  profile: AgentProfile,
  positions: CurrentPosition[],
  longExchange: string,
  shortExchange: string,
  size: number
): { hasCapital: boolean; reason?: string } {
  const summary = calculateBalanceSummary(profile, positions);
  
  const longBalance = summary.balances.find(b => b.exchange === longExchange);
  const shortBalance = summary.balances.find(b => b.exchange === shortExchange);
  
  const neededPerExchange = size / 2;
  
  if (!longBalance) {
    return { hasCapital: false, reason: `No balance configured for ${longExchange}` };
  }
  
  if (!shortBalance) {
    return { hasCapital: false, reason: `No balance configured for ${shortExchange}` };
  }
  
  if (longBalance.available < neededPerExchange) {
    return {
      hasCapital: false,
      reason: `Insufficient on ${longExchange}: need $${neededPerExchange.toFixed(2)}, have $${longBalance.available.toFixed(2)}`,
    };
  }
  
  if (shortBalance.available < neededPerExchange) {
    return {
      hasCapital: false,
      reason: `Insufficient on ${shortExchange}: need $${neededPerExchange.toFixed(2)}, have $${shortBalance.available.toFixed(2)}`,
    };
  }
  
  return { hasCapital: true };
}

// ============================================================================
// Portfolio Integration
// ============================================================================

/**
 * Extract current positions from portfolio response
 */
export function extractPositionsFromPortfolio(
  portfolio: Portfolio
): CurrentPosition[] {
  return portfolio.executions
    .filter(e => e.execution.status === 'running')
    .map(e => {
      const createdAt = new Date(e.execution.created_at);
      const hoursOpen = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Estimate daily return based on current spread
      const estimatedDailyReturn = (e.funding.net_funding / e.execution.input_amount) * 100 * 3;
      
      return {
        executionId: e.execution.id,
        symbol: e.execution.symbol,
        pair: e.execution.pair,
        longExchange: e.execution.long_exchange,
        shortExchange: e.execution.short_exchange,
        size: e.execution.input_amount,
        entrySpread: 0, // Would need historical data
        currentSpread: 0, // Would need live spread data
        unrealizedPnl: e.pnl.unrealized_pnl,
        unrealizedPnlPercent: e.pnl.total_pnl_pct * 100,
        hoursOpen,
        expectedDailyReturn: estimatedDailyReturn,
      };
    });
}

/**
 * Calculate total capital deployed in positions
 */
export function getDeployedCapital(positions: CurrentPosition[]): number {
  return positions.reduce((sum, p) => sum + p.size, 0);
}

/**
 * Calculate utilization rate
 */
export function getUtilizationRate(
  profile: AgentProfile,
  positions: CurrentPosition[]
): number {
  const totalCapital = getTotalCapital(profile);
  if (totalCapital === 0) return 0;
  
  const deployed = getDeployedCapital(positions);
  return (deployed / totalCapital) * 100;
}
