/**
 * Zirodelta Agent SDK - Client
 * 
 * Main client for interacting with the Zirodelta funding rate arbitrage API.
 */

import type {
  ZirodeltaClientConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  ExchangePair,
  ExchangeName,
  GetOpportunitiesParams,
  GetOpportunitiesResponse,
  Opportunity,
  OpportunityDetail,
  ExecuteOpportunityParams,
  ExecuteOpportunityResponse,
  PortfolioParams,
  Portfolio,
  CloseExecutionParams,
  CloseExecutionResponse,
  GetFundingFeesResponse,
  Metrics,
  ExchangeAccount,
} from './types.js';

import {
  ZirodeltaError,
  AuthenticationError,
  RateLimitError,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.zirodelta.xyz';
const DEFAULT_TIMEOUT = 30000;

export class ZirodeltaClient {
  private baseUrl: string;
  private token?: string;
  private timeout: number;
  private debug: boolean;
  private requestId = 0;

  constructor(config: ZirodeltaClientConfig = {}) {
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.token = config.token;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.debug = config.debug || false;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ============================================================================
  // JSON-RPC Transport
  // ============================================================================

  private async rpc<TParams, TResult>(
    method: string,
    params: TParams,
    requiresAuth = false
  ): Promise<TResult> {
    if (requiresAuth && !this.token) {
      throw new AuthenticationError();
    }

    const request: JsonRpcRequest<TParams> = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.requestId,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.debug) {
      console.log('[Zirodelta] Request:', JSON.stringify(request, null, 2));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/jsonrpc/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw new AuthenticationError('Invalid or expired token');
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
      }

      if (!response.ok) {
        throw new ZirodeltaError(
          `HTTP error ${response.status}`,
          'HTTP_ERROR',
          { status: response.status, statusText: response.statusText }
        );
      }

      const json = await response.json() as JsonRpcResponse<TResult>;

      if (this.debug) {
        console.log('[Zirodelta] Response:', JSON.stringify(json, null, 2));
      }

      if (json.error) {
        throw new ZirodeltaError(
          json.error.message,
          `RPC_${json.error.code}`,
          json.error.data
        );
      }

      return json.result as TResult;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ZirodeltaError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ZirodeltaError('Request timeout', 'TIMEOUT');
        }
        throw new ZirodeltaError(error.message, 'NETWORK_ERROR');
      }

      throw new ZirodeltaError('Unknown error', 'UNKNOWN');
    }
  }

  private async get<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });
    
    if (!response.ok) {
      throw new ZirodeltaError(
        `HTTP error ${response.status}`,
        'HTTP_ERROR'
      );
    }

    return response.json() as Promise<T>;
  }

  // ============================================================================
  // Exchange Pairs
  // ============================================================================

  /**
   * Get list of available exchange pairs
   */
  async getExchangePairs(): Promise<ExchangePair[]> {
    return this.rpc<Record<string, never>, ExchangePair[]>('exchange_pair', {});
  }

  /**
   * Get user's connected exchange accounts
   */
  async getAccountExchangePairs(): Promise<ExchangeAccount[]> {
    return this.rpc<Record<string, never>, ExchangeAccount[]>(
      'account_exchange_pair',
      {},
      true
    );
  }

  // ============================================================================
  // Opportunities
  // ============================================================================

  /**
   * Get arbitrage opportunities
   * 
   * @example
   * ```ts
   * const opps = await client.getOpportunities({
   *   exchangepair: 'kucoin-bybit',
   *   limit: 10,
   *   sortby: 'spread'
   * });
   * ```
   */
  async getOpportunities(
    params: GetOpportunitiesParams
  ): Promise<GetOpportunitiesResponse> {
    // API returns different structure, transform it
    interface ApiOpportunity {
      symbol: string;
      pair_uid: string;
      direction: string;
      venues: string;
      long_venue: string;
      short_venue: string;
      epoch_hours: number;
      chosen_per_epoch: number;
      apr: number;
      long_rate: number;
      short_rate: number;
      funding_delta: number;
      next_funding_timestamp: number;
      updated_at: number;
      anomaly_direction?: boolean;
      anomaly_reason?: string | null;
    }
    
    interface ApiResponse {
      status: number;
      data: ApiOpportunity[];
      pagination: {
        current_page: number;
        per_page: number;
        total_count: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
      };
    }

    const response = await this.rpc<GetOpportunitiesParams, ApiResponse>(
      'get_opportunities',
      {
        exchangepair: params.exchangepair,
        page: params.page || 1,
        limit: params.limit || 20,
        q: params.q,
        sortby: params.sortby === 'spread' ? 'apr' : params.sortby || 'apr',
      }
    );

    // Transform to expected format
    const opportunities: Opportunity[] = response.data.map((opp) => ({
      id: opp.pair_uid,
      symbol: opp.symbol,
      pair: opp.venues,
      long_exchange: opp.long_venue as ExchangeName,
      short_exchange: opp.short_venue as ExchangeName,
      long_funding_rate: opp.long_rate * 100, // Convert to percentage
      short_funding_rate: opp.short_rate * 100,
      spread: opp.funding_delta * 100, // funding_delta is the spread
      long_price: 0, // Not provided by API
      short_price: 0,
      price_diff_pct: 0,
      risk_score: opp.anomaly_direction ? 5 : 3, // Simple risk mapping
      liquidity_score: 5,
      next_funding_time: new Date(opp.next_funding_timestamp * 1000).toISOString(),
      hours_to_funding: opp.epoch_hours,
      created_at: new Date(opp.updated_at * 1000).toISOString(),
      updated_at: new Date(opp.updated_at * 1000).toISOString(),
      // Extended fields from API
      apr: opp.apr,
      direction: opp.direction,
      anomaly_reason: opp.anomaly_reason,
    }));

    return {
      opportunities,
      pagination: {
        page: response.pagination.current_page,
        limit: response.pagination.per_page,
        total: response.pagination.total_count,
        total_pages: response.pagination.total_pages,
      },
    };
  }

  /**
   * Get detailed information about a specific opportunity
   */
  async getOpportunityDetail(opportunityId: string): Promise<OpportunityDetail> {
    return this.rpc<{ opportunity_id: string }, OpportunityDetail>(
      'opportunity_detail',
      { opportunity_id: opportunityId }
    );
  }

  /**
   * Convenience method to get top opportunities by spread
   */
  async getTopOpportunities(
    exchangepair: ExchangePair,
    limit = 10
  ): Promise<Opportunity[]> {
    const response = await this.getOpportunities({
      exchangepair,
      limit,
      sortby: 'spread',
    });
    return response.opportunities;
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Execute an arbitrage opportunity
   * 
   * @example
   * ```ts
   * const result = await client.executeOpportunity({
   *   opportunity_id: 'opp_123',
   *   amount: 100,  // $100 USD
   *   mode: 'auto'
   * });
   * ```
   */
  async executeOpportunity(
    params: ExecuteOpportunityParams
  ): Promise<ExecuteOpportunityResponse> {
    return this.rpc<ExecuteOpportunityParams, ExecuteOpportunityResponse>(
      'execute_opportunity',
      {
        opportunity_id: params.opportunity_id,
        amount: params.amount,
        mode: params.mode || 'auto',
      },
      true
    );
  }

  /**
   * Resubmit a failed execution
   */
  async resubmitExecution(jobId: string): Promise<ExecuteOpportunityResponse> {
    return this.rpc<{ job_id: string }, ExecuteOpportunityResponse>(
      'resubmit_execute_opportunity',
      { job_id: jobId },
      true
    );
  }

  /**
   * Close a running execution
   */
  async closeExecution(
    params: CloseExecutionParams
  ): Promise<CloseExecutionResponse> {
    return this.rpc<CloseExecutionParams, CloseExecutionResponse>(
      'close_execution',
      { execution_id: params.execution_id },
      true
    );
  }

  /**
   * Continue execution to next funding epoch
   */
  async continueEpoch(executionId: string): Promise<{ success: boolean; message: string }> {
    return this.rpc<{ execution_id: string }, { success: boolean; message: string }>(
      'continue_epoch',
      { execution_id: executionId },
      true
    );
  }

  /**
   * Check if a pair is currently running/queued for user
   */
  async checkPairStatus(
    pair: string,
    exchange: string
  ): Promise<{ is_active: boolean; execution?: unknown }> {
    return this.rpc<{ pair: string; exchange: string }, { is_active: boolean; execution?: unknown }>(
      'check_pair_status',
      { pair, exchange },
      true
    );
  }

  // ============================================================================
  // Portfolio
  // ============================================================================

  /**
   * Get live portfolio with real-time position data
   */
  async getPortfolio(params: PortfolioParams = {}): Promise<Portfolio> {
    return this.rpc<PortfolioParams, Portfolio>(
      'portfolio_live',
      { execution_id: params.execution_id },
      true
    );
  }

  /**
   * Get portfolio v2 (optimized version)
   */
  async getPortfolioV2(params: PortfolioParams = {}): Promise<Portfolio> {
    return this.rpc<PortfolioParams, Portfolio>(
      'portfolio_live_v2',
      { execution_id: params.execution_id },
      true
    );
  }

  /**
   * Get executed opportunities for a specific pair/exchange
   */
  async getExecutedOpportunities(
    pair: string,
    exchange: string
  ): Promise<unknown[]> {
    return this.rpc<{ pair: string; exchange: string }, unknown[]>(
      'get_executed_opportunity',
      { pair, exchange },
      true
    );
  }

  // ============================================================================
  // Metrics
  // ============================================================================

  /**
   * Get funding fees breakdown
   */
  async getFundingFees(): Promise<GetFundingFeesResponse> {
    return this.get<GetFundingFeesResponse>('/metrics/funding-fees');
  }

  /**
   * Get platform metrics
   */
  async getMetrics(): Promise<Metrics> {
    const [
      timestamp,
      executions,
      volume,
      roi,
      tvl,
    ] = await Promise.all([
      this.get<{ timestamp: string }>('/metrics/timestamp'),
      this.get<{ queued_count: number; running_count: number; active_count: number }>(
        '/metrics/executions/active'
      ),
      this.get<{ total_volume: number; trade_count: number }>(
        '/metrics/volume'
      ),
      this.get<{ averageROI: number }>('/metrics/arbitrage-roi'),
      this.get<{ tvl: number }>('/metrics/tvl'),
    ]);

    return {
      timestamp: timestamp.timestamp,
      visitors_15m: 0,
      active_users_15m: 0,
      queued_count: executions.queued_count,
      running_count: executions.running_count,
      active_count: executions.active_count,
      daily_volume: 0,
      total_volume: volume.total_volume,
      trade_count: volume.trade_count,
      realized_pnl: 0,
      average_roi: roi.averageROI,
      daily_roi: 0,
      tvl: tvl.tvl,
    };
  }

  // ============================================================================
  // Health
  // ============================================================================

  /**
   * Check API health
   */
  async health(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/health');
  }

  /**
   * Test JSON-RPC connection
   */
  async test(): Promise<string> {
    return this.rpc<Record<string, never>, string>('test', {});
  }
}
