/**
 * Zirodelta Strategy Engine - Type Definitions
 * 
 * Types for the intelligent strategy layer that adapts to each agent's situation.
 */

import type { Opportunity, ExchangeName } from '../sdk/types.js';

// ============================================================================
// Risk Profile Types
// ============================================================================

export type RiskProfileType = 'conservative' | 'moderate' | 'aggressive';

export interface RiskProfileSettings {
  type: RiskProfileType;
  maxPositionSizePercent: number;  // Max % of capital per position
  riskWeight: number;              // Weight for risk in scoring
  minSpread: number;               // Minimum spread to consider
  maxLeverage: number;             // Maximum leverage allowed
  stopLossPercent: number;         // Recommended stop loss %
  diversificationMin: number;      // Min positions for diversification
}

// ============================================================================
// Agent Profile Types
// ============================================================================

export interface ExchangeConfig {
  enabled: boolean;
  apiKeyConfigured?: boolean;
}

export interface AgentProfile {
  /** Available capital per exchange in USDT */
  balances: { [exchange: string]: number };
  
  /** Risk profile setting */
  riskProfile: RiskProfileType;
  
  /** Target daily return % (e.g., 1.0 = 1%) */
  dailyTarget: number;
  
  /** Max % of total capital per position */
  maxPositionSize: number;
  
  /** Max concurrent positions */
  maxOpenPositions: number;
  
  /** Minimum spread to consider (e.g., 0.03 = 3%) */
  minSpread: number;
  
  /** Exchange configurations */
  exchanges: { [exchange: string]: ExchangeConfig };
  
  /** Profile creation timestamp */
  createdAt?: string;
  
  /** Last update timestamp */
  updatedAt?: string;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface RecommendedOpportunity {
  /** The underlying opportunity */
  opportunity: Opportunity;
  
  /** Recommended position size in USDT */
  recommendedSize: number;
  
  /** Exchange assignment */
  exchange: {
    long: string;
    short: string;
  };
  
  /** Expected return from this position (%) */
  expectedReturn: number;
  
  /** Risk score (0-100, lower is safer) */
  riskScore: number;
  
  /** Opportunity score for ranking */
  score: number;
  
  /** Reasoning for recommendation */
  reasoning: string[];
}

export interface StrategyRecommendation {
  /** Recommended opportunities ranked by score */
  opportunities: RecommendedOpportunity[];
  
  /** Expected daily return if all recommendations followed (%) */
  expectedDailyReturn: number;
  
  /** Overall risk level assessment */
  riskLevel: 'low' | 'medium' | 'high';
  
  /** What % of capital would be utilized */
  capitalUtilization: number;
  
  /** Progress toward daily target (0-100+%) */
  progressToTarget: number;
  
  /** Summary message */
  summary: string;
  
  /** Warnings or alerts */
  warnings: string[];
}

// ============================================================================
// Target Progress Types
// ============================================================================

export interface CurrentPosition {
  executionId: string;
  symbol: string;
  pair: string;
  longExchange: ExchangeName;
  shortExchange: ExchangeName;
  size: number;
  entrySpread: number;
  currentSpread: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  hoursOpen: number;
  expectedDailyReturn: number;
}

export interface TargetProgress {
  /** Daily target % */
  dailyTarget: number;
  
  /** Current projected daily return from positions (%) */
  currentDailyReturn: number;
  
  /** Progress percentage (0-100+) */
  progressPercent: number;
  
  /** Number of positions needed to hit target */
  positionsNeededForTarget: number;
  
  /** Current open positions */
  currentPositions: CurrentPosition[];
  
  /** Total capital deployed */
  totalDeployed: number;
  
  /** Total available capital */
  totalAvailable: number;
  
  /** Suggested actions */
  suggestions: string[];
}

// ============================================================================
// Balance Types
// ============================================================================

export interface ExchangeBalance {
  exchange: ExchangeName;
  total: number;
  available: number;
  allocated: number;
  margin: number;
}

export interface BalanceSummary {
  balances: ExchangeBalance[];
  totalCapital: number;
  totalAvailable: number;
  totalAllocated: number;
  rebalanceSuggestions: RebalanceSuggestion[];
}

export interface RebalanceSuggestion {
  from: ExchangeName;
  to: ExchangeName;
  amount: number;
  reason: string;
}

// ============================================================================
// Position Sizing Types
// ============================================================================

export interface PositionSizeResult {
  recommendedSize: number;
  maxAllowedSize: number;
  minViableSize: number;
  reasoning: string[];
  warnings: string[];
}

// ============================================================================
// Diversification Types
// ============================================================================

export interface DiversificationAnalysis {
  score: number;  // 0-100
  byExchange: { [exchange: string]: number };  // Exposure %
  bySymbol: { [symbol: string]: number };      // Exposure %
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// Stop Loss Types
// ============================================================================

export interface StopLossRecommendation {
  recommendedStopLoss: number;  // Price or %
  aggressiveStopLoss: number;
  conservativeStopLoss: number;
  reasoning: string;
}
