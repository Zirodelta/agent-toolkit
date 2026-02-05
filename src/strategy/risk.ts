/**
 * Zirodelta Strategy Engine - Risk Management
 * 
 * Risk profiles, position sizing rules, and diversification logic.
 */

import type {
  RiskProfileType,
  RiskProfileSettings,
  AgentProfile,
  DiversificationAnalysis,
  StopLossRecommendation,
  CurrentPosition,
} from './types.js';
import type { Opportunity } from '../sdk/types.js';

// ============================================================================
// Risk Profile Presets
// ============================================================================

export const RISK_PROFILES: Record<RiskProfileType, RiskProfileSettings> = {
  conservative: {
    type: 'conservative',
    maxPositionSizePercent: 20,  // Max 20% of capital per position
    riskWeight: 2.0,            // High penalty for risk
    minSpread: 0.05,            // Only 5%+ spreads
    maxLeverage: 3,             // Low leverage
    stopLossPercent: 2,         // Tight stop loss
    diversificationMin: 5,      // Require 5+ positions
  },
  moderate: {
    type: 'moderate',
    maxPositionSizePercent: 40,  // Max 40% of capital per position
    riskWeight: 1.0,             // Balanced risk consideration
    minSpread: 0.03,             // 3%+ spreads
    maxLeverage: 5,              // Moderate leverage
    stopLossPercent: 5,          // Medium stop loss
    diversificationMin: 3,       // Require 3+ positions
  },
  aggressive: {
    type: 'aggressive',
    maxPositionSizePercent: 80,  // Max 80% of capital per position
    riskWeight: 0.5,             // Low penalty for risk
    minSpread: 0.01,             // Accept 1%+ spreads
    maxLeverage: 10,             // High leverage
    stopLossPercent: 10,         // Wide stop loss
    diversificationMin: 1,       // Single position OK
  },
};

/**
 * Get risk profile settings for a given type
 */
export function getRiskProfile(type: RiskProfileType): RiskProfileSettings {
  return RISK_PROFILES[type];
}

/**
 * Get all available risk profiles
 */
export function getAllRiskProfiles(): RiskProfileSettings[] {
  return Object.values(RISK_PROFILES);
}

// ============================================================================
// Opportunity Risk Scoring
// ============================================================================

export interface RiskFactors {
  spreadRisk: number;       // Risk from low spread
  volumeRisk: number;       // Risk from low volume/liquidity
  fundingTimeRisk: number;  // Risk from time to funding
  priceDeviation: number;   // Risk from price difference
  overall: number;          // Combined risk score
}

/**
 * Calculate risk factors for an opportunity
 */
export function calculateRiskFactors(opportunity: Opportunity): RiskFactors {
  // Spread risk - lower spread = higher risk of not capturing value
  const spreadRisk = Math.max(0, 100 - (opportunity.spread * 100 * 10));
  
  // Use the opportunity's built-in risk score (inverted - higher = riskier)
  const volumeRisk = 100 - (opportunity.liquidity_score || 50);
  
  // Time to funding risk - closer is better (less time for spread to change)
  const hoursToFunding = opportunity.hours_to_funding || 8;
  const fundingTimeRisk = Math.min(100, hoursToFunding * 5);
  
  // Price deviation risk - larger deviation = higher risk
  const priceDeviation = Math.abs(opportunity.price_diff_pct || 0) * 100;
  
  // Combined risk score (0-100, higher = riskier)
  const overall = (
    spreadRisk * 0.3 +
    volumeRisk * 0.3 +
    fundingTimeRisk * 0.2 +
    priceDeviation * 0.2
  );
  
  return {
    spreadRisk,
    volumeRisk,
    fundingTimeRisk,
    priceDeviation,
    overall,
  };
}

/**
 * Score an opportunity based on risk profile
 * Higher score = better opportunity
 */
export function scoreOpportunity(
  opportunity: Opportunity,
  profile: AgentProfile
): number {
  const riskSettings = getRiskProfile(profile.riskProfile);
  const riskFactors = calculateRiskFactors(opportunity);
  
  // Base score from spread (annualized %)
  const spreadScore = opportunity.spread * 100;
  
  // Volume/liquidity bonus
  const volumeScore = (opportunity.liquidity_score || 50) / 10;
  
  // Risk penalty based on profile
  const riskPenalty = riskFactors.overall * riskSettings.riskWeight / 100;
  
  // Time to funding bonus (closer = better)
  const hoursToFunding = opportunity.hours_to_funding || 8;
  const timeBonus = hoursToFunding < 2 ? 5 : hoursToFunding < 4 ? 2 : 0;
  
  // Final score
  const score = spreadScore - riskPenalty + volumeScore + timeBonus;
  
  return Math.max(0, score);
}

// ============================================================================
// Position Sizing
// ============================================================================

/**
 * Calculate optimal position size based on profile and opportunity
 */
export function calculatePositionSize(
  opportunity: Opportunity,
  profile: AgentProfile,
  currentPositionsCount: number
): { size: number; reasoning: string[] } {
  const riskSettings = getRiskProfile(profile.riskProfile);
  const reasoning: string[] = [];
  
  // Get total available capital across exchanges
  const totalCapital = Object.values(profile.balances).reduce((a, b) => a + b, 0);
  
  // Get capital on relevant exchanges
  const longExchange = opportunity.long_exchange;
  const shortExchange = opportunity.short_exchange;
  const longBalance = profile.balances[longExchange] || 0;
  const shortBalance = profile.balances[shortExchange] || 0;
  const relevantCapital = Math.min(longBalance, shortBalance) * 2;
  
  // Start with max allowed size from profile
  let maxSize = totalCapital * (profile.maxPositionSize / 100);
  reasoning.push(`Max position size: ${profile.maxPositionSize}% of capital = $${maxSize.toFixed(2)}`);
  
  // Apply risk profile constraint
  const riskMaxSize = relevantCapital * (riskSettings.maxPositionSizePercent / 100);
  if (riskMaxSize < maxSize) {
    maxSize = riskMaxSize;
    reasoning.push(`Risk profile (${profile.riskProfile}) limits to $${maxSize.toFixed(2)}`);
  }
  
  // Adjust for existing positions (ensure diversification)
  const remainingSlots = profile.maxOpenPositions - currentPositionsCount;
  if (remainingSlots <= 0) {
    reasoning.push('Max positions reached - no new positions recommended');
    return { size: 0, reasoning };
  }
  
  // Calculate available capital per remaining slot
  const availablePerSlot = totalCapital / profile.maxOpenPositions;
  if (availablePerSlot < maxSize) {
    maxSize = availablePerSlot;
    reasoning.push(`Diversification: reserving capital for ${remainingSlots} more positions`);
  }
  
  // Apply opportunity-specific risk adjustment
  const riskFactors = calculateRiskFactors(opportunity);
  if (riskFactors.overall > 70) {
    maxSize *= 0.5;
    reasoning.push(`High risk opportunity (${riskFactors.overall.toFixed(0)}) - reduced size by 50%`);
  } else if (riskFactors.overall > 50) {
    maxSize *= 0.75;
    reasoning.push(`Medium risk (${riskFactors.overall.toFixed(0)}) - reduced size by 25%`);
  }
  
  // Ensure minimum viable size
  const minSize = 50; // Minimum $50 position
  if (maxSize < minSize) {
    reasoning.push(`Position too small (< $${minSize}) - skipping`);
    return { size: 0, reasoning };
  }
  
  return {
    size: Math.floor(maxSize),
    reasoning,
  };
}

// ============================================================================
// Diversification Analysis
// ============================================================================

/**
 * Analyze diversification of current positions
 */
export function analyzeDiversification(
  positions: CurrentPosition[],
  profile: AgentProfile
): DiversificationAnalysis {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (positions.length === 0) {
    return {
      score: 0,
      byExchange: {},
      bySymbol: {},
      warnings: ['No positions open'],
      suggestions: ['Open positions to start earning funding'],
    };
  }
  
  // Calculate exposure by exchange
  const totalSize = positions.reduce((sum, p) => sum + p.size, 0);
  const byExchange: { [exchange: string]: number } = {};
  const bySymbol: { [symbol: string]: number } = {};
  
  for (const pos of positions) {
    // Exchange exposure
    const longExposure = (pos.size / 2) / totalSize * 100;
    const shortExposure = (pos.size / 2) / totalSize * 100;
    
    byExchange[pos.longExchange] = (byExchange[pos.longExchange] || 0) + longExposure;
    byExchange[pos.shortExchange] = (byExchange[pos.shortExchange] || 0) + shortExposure;
    
    // Symbol exposure
    bySymbol[pos.symbol] = (bySymbol[pos.symbol] || 0) + (pos.size / totalSize * 100);
  }
  
  // Check for concentration risks
  const riskSettings = getRiskProfile(profile.riskProfile);
  const maxAllowedConcentration = 100 / riskSettings.diversificationMin;
  
  for (const [exchange, exposure] of Object.entries(byExchange)) {
    if (exposure > maxAllowedConcentration) {
      warnings.push(`High exposure to ${exchange}: ${exposure.toFixed(1)}%`);
    }
  }
  
  for (const [symbol, exposure] of Object.entries(bySymbol)) {
    if (exposure > maxAllowedConcentration) {
      warnings.push(`Concentrated in ${symbol}: ${exposure.toFixed(1)}%`);
      suggestions.push(`Consider diversifying away from ${symbol}`);
    }
  }
  
  // Calculate diversification score
  const numPositions = positions.length;
  const numExchanges = Object.keys(byExchange).length;
  const numSymbols = Object.keys(bySymbol).length;
  
  // Score based on number of positions vs target
  const positionScore = Math.min(100, (numPositions / riskSettings.diversificationMin) * 100);
  
  // Penalty for high concentration
  const maxExchangeConcentration = Math.max(...Object.values(byExchange));
  const maxSymbolConcentration = Math.max(...Object.values(bySymbol));
  const concentrationPenalty = (maxExchangeConcentration + maxSymbolConcentration) / 4;
  
  const score = Math.max(0, Math.min(100, positionScore - concentrationPenalty));
  
  if (numPositions < riskSettings.diversificationMin) {
    suggestions.push(`Add ${riskSettings.diversificationMin - numPositions} more positions for better diversification`);
  }
  
  return {
    score,
    byExchange,
    bySymbol,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Stop Loss Recommendations
// ============================================================================

/**
 * Get stop loss recommendation based on risk profile
 */
export function getStopLossRecommendation(
  entryPrice: number,
  profile: AgentProfile
): StopLossRecommendation {
  const riskSettings = getRiskProfile(profile.riskProfile);
  
  const conservativeStop = entryPrice * (1 - 0.02); // 2% stop
  const moderateStop = entryPrice * (1 - riskSettings.stopLossPercent / 100);
  const aggressiveStop = entryPrice * (1 - 0.10); // 10% stop
  
  return {
    recommendedStopLoss: moderateStop,
    conservativeStopLoss: conservativeStop,
    aggressiveStopLoss: aggressiveStop,
    reasoning: `Based on ${profile.riskProfile} risk profile, ${riskSettings.stopLossPercent}% stop loss recommended`,
  };
}

/**
 * Check if a position should be stopped out
 */
export function shouldStopOut(
  position: CurrentPosition,
  profile: AgentProfile
): { shouldStop: boolean; reason?: string } {
  const riskSettings = getRiskProfile(profile.riskProfile);
  
  // Check if loss exceeds stop loss threshold
  if (position.unrealizedPnlPercent < -riskSettings.stopLossPercent) {
    return {
      shouldStop: true,
      reason: `Loss (${position.unrealizedPnlPercent.toFixed(2)}%) exceeds stop loss (${riskSettings.stopLossPercent}%)`,
    };
  }
  
  // Check if spread has inverted significantly
  if (position.currentSpread < 0 && position.currentSpread < -0.02) {
    return {
      shouldStop: true,
      reason: `Spread inverted to ${(position.currentSpread * 100).toFixed(2)}%`,
    };
  }
  
  return { shouldStop: false };
}
