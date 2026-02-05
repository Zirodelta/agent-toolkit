/**
 * Zirodelta Strategy Engine
 * 
 * Intelligent layer that adapts to each agent's situation.
 * 
 * @example
 * ```ts
 * import { ZirodeltaClient, StrategyEngine } from 'zirodelta-agent-toolkit';
 * 
 * const client = new ZirodeltaClient({ token: 'your-token' });
 * const engine = new StrategyEngine(client);
 * 
 * // Set up your profile
 * engine.setProfile({
 *   balances: { bybit: 1000, kucoin: 1000 },
 *   riskProfile: 'moderate',
 *   dailyTarget: 1.0,
 *   maxPositionSize: 30,
 *   maxOpenPositions: 5,
 *   minSpread: 0.03,
 *   exchanges: {
 *     bybit: { enabled: true },
 *     kucoin: { enabled: true },
 *   },
 * });
 * 
 * // Get recommendations
 * const recommendations = await engine.getRecommendations();
 * console.log(recommendations.summary);
 * ```
 * 
 * @packageDocumentation
 */

// Engine
export {
  StrategyEngine,
  createStrategyEngine,
  getDefaultProfile,
} from './engine.js';

// Risk management
export {
  RISK_PROFILES,
  getRiskProfile,
  getAllRiskProfiles,
  calculateRiskFactors,
  scoreOpportunity,
  calculatePositionSize,
  analyzeDiversification,
  getStopLossRecommendation,
  shouldStopOut,
} from './risk.js';

// Balance management
export {
  calculateBalanceSummary,
  fetchLiveBalances,
  updateBalance,
  getTotalCapital,
  getAvailableCapital,
  hasCapitalFor,
  extractPositionsFromPortfolio,
  getDeployedCapital,
  getUtilizationRate,
} from './balance.js';

// Types
export type {
  // Core types
  RiskProfileType,
  RiskProfileSettings,
  AgentProfile,
  ExchangeConfig,
  
  // Recommendations
  StrategyRecommendation,
  RecommendedOpportunity,
  
  // Target tracking
  TargetProgress,
  CurrentPosition,
  
  // Balance
  ExchangeBalance,
  BalanceSummary,
  RebalanceSuggestion,
  
  // Position sizing
  PositionSizeResult,
  
  // Diversification
  DiversificationAnalysis,
  
  // Stop loss
  StopLossRecommendation,
} from './types.js';
