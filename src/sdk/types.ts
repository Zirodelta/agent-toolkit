/**
 * Zirodelta Agent SDK - Type Definitions
 * 
 * Complete type definitions for the Zirodelta funding rate arbitrage API.
 */

// ============================================================================
// JSON-RPC Types
// ============================================================================

export interface JsonRpcRequest<T = unknown> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id: number | string;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: JsonRpcError;
  id: number | string;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================================================
// Exchange Types
// ============================================================================

export type ExchangeName = 'bybit' | 'kucoin' | 'hyperliquid' | 'pacifica';

export type ExchangePair = 
  | 'kucoin-bybit'
  | 'bybit-kucoin'
  | 'hyperliquid-bybit'
  | 'bybit-hyperliquid'
  | 'pacifica-bybit'
  | 'bybit-pacifica';

export interface ExchangeAccount {
  id: string;
  exchange: ExchangeName;
  user_id: string;
  is_connected: boolean;
  connected_at?: string;
}

// ============================================================================
// Opportunity Types
// ============================================================================

export interface Opportunity {
  id: string;
  symbol: string;
  pair: string;
  
  // Exchange details
  long_exchange: ExchangeName;
  short_exchange: ExchangeName;
  
  // Funding rates (percentage)
  long_funding_rate: number;
  short_funding_rate: number;
  spread: number;
  
  // Price info
  long_price: number;
  short_price: number;
  price_diff_pct: number;
  
  // Risk metrics
  risk_score: number;
  liquidity_score: number;
  
  // Timing
  next_funding_time: string;
  hours_to_funding: number;
  
  // Metadata
  created_at: string;
  updated_at: string;

  // Extended fields from API
  apr?: number;               // Annualized percentage rate
  direction?: string;         // "Long Bybit / Short KuCoin" etc.
  anomaly_reason?: string | null;
}

export interface OpportunityDetail extends Opportunity {
  // Extended details
  long_mark_price: number;
  short_mark_price: number;
  long_index_price: number;
  short_index_price: number;
  
  // Volume data
  long_24h_volume: number;
  short_24h_volume: number;
  
  // Open interest
  long_open_interest: number;
  short_open_interest: number;
  
  // Historical funding
  avg_spread_24h: number;
  avg_spread_7d: number;
  funding_history: FundingHistoryEntry[];
}

export interface FundingHistoryEntry {
  timestamp: string;
  long_rate: number;
  short_rate: number;
  spread: number;
}

export interface GetOpportunitiesParams {
  exchangepair: ExchangePair;
  page?: number;
  limit?: number;
  q?: string;  // Search query (symbol filter)
  sortby?: 'spread' | 'apr' | 'funding_delta' | 'epoch_hours' | 'risk_score' | 'liquidity_score' | 'next_funding_time';
}

export interface GetOpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Execution Types
// ============================================================================

export type ExecutionMode = 'auto' | 'manual';
export type ExecutionStatus = 'queued' | 'running' | 'closing' | 'closed' | 'failed';

export interface ExecuteOpportunityParams {
  opportunity_id: string;
  amount: number;  // USD amount to trade
  mode?: ExecutionMode;
}

export interface ExecuteOpportunityResponse {
  success: boolean;
  job_id: string;
  execution_id: string;
  message: string;
  estimated_entry_time: string;
}

export interface Execution {
  id: string;
  user_id: string;
  opportunity_id: string;
  job_id: string;
  
  // Position details
  symbol: string;
  pair: string;
  long_exchange: ExchangeName;
  short_exchange: ExchangeName;
  
  // Amounts
  input_amount: number;
  long_size: number;
  short_size: number;
  
  // Entry prices
  long_entry_price: number;
  short_entry_price: number;
  avg_entry_price: number;
  
  // Status
  status: ExecutionStatus;
  mode: ExecutionMode;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

// ============================================================================
// Portfolio Types
// ============================================================================

export interface PortfolioParams {
  execution_id?: string;  // Filter by specific execution
}

export interface Portfolio {
  executions: PortfolioExecution[];
  summary: PortfolioSummary;
}

export interface PortfolioExecution {
  execution: Execution;
  
  // Current position
  long_position: Position;
  short_position: Position;
  
  // PnL
  pnl: PnLBreakdown;
  
  // Funding
  funding: FundingBreakdown;
}

export interface Position {
  exchange: ExchangeName;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  mark_price: number;
  liquidation_price: number;
  leverage: number;
  margin: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

export interface PnLBreakdown {
  unrealized_pnl: number;
  realized_pnl: number;
  total_pnl: number;
  total_pnl_pct: number;
  
  // Components
  long_pnl: number;
  short_pnl: number;
  funding_pnl: number;
  fee_cost: number;
}

export interface FundingBreakdown {
  total_received: number;
  total_paid: number;
  net_funding: number;
  
  // Per-exchange
  long_funding: number;
  short_funding: number;
  
  // History
  funding_events: FundingEvent[];
}

export interface FundingEvent {
  timestamp: string;
  exchange: ExchangeName;
  symbol: string;
  amount: number;
  rate: number;
}

export interface PortfolioSummary {
  total_executions: number;
  running_executions: number;
  
  // Totals
  total_invested: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_funding_received: number;
  total_funding_paid: number;
  
  // ROI
  weighted_roi: number;
  daily_roi: number;
}

// ============================================================================
// Close Execution Types
// ============================================================================

export interface CloseExecutionParams {
  execution_id: string;
}

export interface CloseExecutionResponse {
  success: boolean;
  execution_id: string;
  message: string;
  
  // Final stats
  final_pnl: number;
  final_roi_pct: number;
  total_funding: number;
  duration_hours: number;
}

// ============================================================================
// Funding Fees Types
// ============================================================================

export interface GetFundingFeesResponse {
  total_funding_fee: number;
  total_received: number;
  total_paid: number;
  
  breakdown: {
    closed: {
      received: number;
      paid: number;
      net: number;
    };
    running: {
      received: number;
      paid: number;
      net: number;
    };
  };
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface Metrics {
  timestamp: string;
  
  // Active users
  visitors_15m: number;
  active_users_15m: number;
  
  // Executions
  queued_count: number;
  running_count: number;
  active_count: number;
  
  // Volume
  daily_volume: number;
  total_volume: number;
  trade_count: number;
  
  // PnL
  realized_pnl: number;
  
  // ROI
  average_roi: number;
  daily_roi: number;
  
  // TVL
  tvl: number;
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface ZirodeltaClientConfig {
  /** Base URL for the API (default: https://api.zirodelta.com) */
  baseUrl?: string;
  
  /** Bearer token for authentication */
  token?: string;
  
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class ZirodeltaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ZirodeltaError';
  }
}

export class AuthenticationError extends ZirodeltaError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ZirodeltaError {
  constructor(public retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class ExecutionError extends ZirodeltaError {
  constructor(message: string, public executionId?: string) {
    super(message, 'EXECUTION_ERROR');
    this.name = 'ExecutionError';
  }
}
