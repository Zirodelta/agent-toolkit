/**
 * Zirodelta Agent SDK
 * 
 * Agent-native infrastructure for autonomous funding rate farming.
 * 
 * @example
 * ```ts
 * import { ZirodeltaClient } from '@zirodelta/agent-toolkit';
 * 
 * const client = new ZirodeltaClient({
 *   token: process.env.ZIRODELTA_TOKEN
 * });
 * 
 * // Get top opportunities
 * const opps = await client.getTopOpportunities('kucoin-bybit', 5);
 * 
 * // Execute best opportunity
 * if (opps.length > 0) {
 *   const result = await client.executeOpportunity({
 *     opportunity_id: opps[0].id,
 *     amount: 100
 *   });
 * }
 * ```
 * 
 * @packageDocumentation
 */

export { ZirodeltaClient } from './client.js';

// Re-export all types
export type {
  // Config
  ZirodeltaClientConfig,
  
  // JSON-RPC
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  
  // Exchange
  ExchangeName,
  ExchangePair,
  ExchangeAccount,
  
  // Opportunities
  Opportunity,
  OpportunityDetail,
  FundingHistoryEntry,
  GetOpportunitiesParams,
  GetOpportunitiesResponse,
  
  // Execution
  ExecutionMode,
  ExecutionStatus,
  ExecuteOpportunityParams,
  ExecuteOpportunityResponse,
  Execution,
  
  // Portfolio
  PortfolioParams,
  Portfolio,
  PortfolioExecution,
  PortfolioSummary,
  Position,
  PnLBreakdown,
  FundingBreakdown,
  FundingEvent,
  
  // Close
  CloseExecutionParams,
  CloseExecutionResponse,
  
  // Funding
  GetFundingFeesResponse,
  
  // Metrics
  Metrics,
} from './types.js';

// Re-export errors
export {
  ZirodeltaError,
  AuthenticationError,
  RateLimitError,
  ExecutionError,
} from './types.js';

// Re-export strategy engine
export {
  StrategyEngine,
  createStrategyEngine,
  getDefaultProfile,
  getRiskProfile,
  getAllRiskProfiles,
  RISK_PROFILES,
} from '../strategy/index.js';

// Re-export strategy types
export type {
  RiskProfileType,
  RiskProfileSettings,
  AgentProfile,
  ExchangeConfig,
  StrategyRecommendation,
  RecommendedOpportunity,
  TargetProgress,
  CurrentPosition,
  ExchangeBalance,
  BalanceSummary,
  RebalanceSuggestion,
  PositionSizeResult,
  DiversificationAnalysis,
  StopLossRecommendation,
} from '../strategy/types.js';

// Convenience factory function
import { ZirodeltaClient } from './client.js';
import type { ZirodeltaClientConfig } from './types.js';

/**
 * Create a new Zirodelta client
 * 
 * @example
 * ```ts
 * const client = createClient({ token: 'your-token' });
 * ```
 */
export function createClient(config?: ZirodeltaClientConfig): ZirodeltaClient {
  return new ZirodeltaClient(config);
}

// Default export for convenience
export default ZirodeltaClient;
