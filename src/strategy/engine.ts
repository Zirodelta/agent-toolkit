/**
 * Zirodelta Strategy Engine - Main Engine
 * 
 * Intelligent layer that adapts to each agent's situation.
 */

import type {
  AgentProfile,
  StrategyRecommendation,
  RecommendedOpportunity,
  TargetProgress,
  CurrentPosition,
  RiskProfileType,
} from './types.js';
import type { Opportunity, ExchangePair, Portfolio } from '../sdk/types.js';
import { ZirodeltaClient } from '../sdk/client.js';
import {
  scoreOpportunity,
  calculatePositionSize,
  getRiskProfile,
  analyzeDiversification,
  shouldStopOut,
  calculateRiskFactors,
} from './risk.js';
import {
  calculateBalanceSummary,
  extractPositionsFromPortfolio,
  getTotalCapital,
  getDeployedCapital,
  getUtilizationRate,
  hasCapitalFor,
} from './balance.js';

// ============================================================================
// Strategy Engine Class
// ============================================================================

export class StrategyEngine {
  private client: ZirodeltaClient;
  private profile: AgentProfile | null = null;
  private currentPositions: CurrentPosition[] = [];

  constructor(client: ZirodeltaClient) {
    this.client = client;
  }

  // ============================================================================
  // Profile Management
  // ============================================================================

  /**
   * Set the agent's profile configuration
   */
  setProfile(profile: AgentProfile): void {
    this.profile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get the current profile
   */
  getProfile(): AgentProfile | null {
    return this.profile;
  }

  /**
   * Check if a profile is configured
   */
  hasProfile(): boolean {
    return this.profile !== null;
  }

  /**
   * Update profile risk settings
   */
  setRiskProfile(type: RiskProfileType): void {
    if (!this.profile) {
      throw new Error('No profile configured. Call setProfile first.');
    }
    
    const riskSettings = getRiskProfile(type);
    this.profile = {
      ...this.profile,
      riskProfile: type,
      minSpread: riskSettings.minSpread,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update daily target
   */
  setDailyTarget(target: number): void {
    if (!this.profile) {
      throw new Error('No profile configured. Call setProfile first.');
    }
    
    if (target < 0 || target > 100) {
      throw new Error('Daily target must be between 0 and 100%');
    }
    
    this.profile = {
      ...this.profile,
      dailyTarget: target,
      updatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  /**
   * Get smart recommendations based on current profile and market conditions
   */
  async getRecommendations(): Promise<StrategyRecommendation> {
    if (!this.profile) {
      throw new Error('No profile configured. Call setProfile first.');
    }

    const profile = this.profile;
    const warnings: string[] = [];

    // Refresh current positions
    await this.refreshPositions();

    // Get opportunities from all enabled exchange pairs
    const opportunities = await this.fetchAllOpportunities();

    // Filter and score opportunities
    const scored = opportunities
      .filter(opp => opp.spread >= profile.minSpread)
      .map(opp => this.analyzeOpportunity(opp))
      .filter((rec): rec is RecommendedOpportunity => rec !== null)
      .sort((a, b) => b.score - a.score);

    // Select top opportunities within position limits
    const remainingSlots = profile.maxOpenPositions - this.currentPositions.length;
    const selectedOpportunities = scored.slice(0, remainingSlots);

    // Calculate expected return if recommendations followed
    const expectedDailyReturn = selectedOpportunities.reduce(
      (sum, rec) => sum + rec.expectedReturn,
      this.getCurrentProjectedReturn()
    );

    // Calculate capital utilization
    const totalCapital = getTotalCapital(profile);
    const currentlyDeployed = getDeployedCapital(this.currentPositions);
    const newDeployment = selectedOpportunities.reduce((sum, rec) => sum + rec.recommendedSize, 0);
    const capitalUtilization = totalCapital > 0 
      ? ((currentlyDeployed + newDeployment) / totalCapital) * 100 
      : 0;

    // Progress to target
    const progressToTarget = profile.dailyTarget > 0 
      ? (expectedDailyReturn / profile.dailyTarget) * 100 
      : 0;

    // Determine risk level
    const avgRiskScore = scored.length > 0
      ? scored.reduce((sum, r) => sum + r.riskScore, 0) / scored.length
      : 50;
    const riskLevel = avgRiskScore < 30 ? 'low' : avgRiskScore < 60 ? 'medium' : 'high';

    // Generate warnings
    if (remainingSlots === 0) {
      warnings.push('Maximum positions reached. Close a position to open new ones.');
    }

    if (capitalUtilization < 50 && selectedOpportunities.length === 0) {
      warnings.push('Low capital utilization with no recommendations. Consider lowering min spread.');
    }

    if (progressToTarget < 50) {
      warnings.push(`Only at ${progressToTarget.toFixed(0)}% of daily target.`);
    }

    // Check for stop-loss warnings on current positions
    for (const pos of this.currentPositions) {
      const stopCheck = shouldStopOut(pos, profile);
      if (stopCheck.shouldStop) {
        warnings.push(`⚠️ ${pos.symbol}: ${stopCheck.reason}`);
      }
    }

    // Generate summary
    const summary = this.generateSummary(
      selectedOpportunities,
      expectedDailyReturn,
      progressToTarget,
      capitalUtilization
    );

    return {
      opportunities: selectedOpportunities,
      expectedDailyReturn,
      riskLevel,
      capitalUtilization,
      progressToTarget,
      summary,
      warnings,
    };
  }

  /**
   * Analyze a single opportunity for this agent
   */
  analyzeOpportunity(opportunity: Opportunity): RecommendedOpportunity | null {
    if (!this.profile) {
      return null;
    }

    const profile = this.profile;

    // Check if spread meets minimum
    if (opportunity.spread < profile.minSpread) {
      return null;
    }

    // Check if exchanges are enabled
    const longEnabled = profile.exchanges[opportunity.long_exchange]?.enabled ?? false;
    const shortEnabled = profile.exchanges[opportunity.short_exchange]?.enabled ?? false;
    
    if (!longEnabled || !shortEnabled) {
      return null;
    }

    // Check if we have capital
    const { size, reasoning } = calculatePositionSize(
      opportunity,
      profile,
      this.currentPositions.length
    );

    if (size === 0) {
      return null;
    }

    // Check capital availability
    const capitalCheck = hasCapitalFor(
      profile,
      this.currentPositions,
      opportunity.long_exchange,
      opportunity.short_exchange,
      size
    );

    if (!capitalCheck.hasCapital) {
      reasoning.push(capitalCheck.reason || 'Insufficient capital');
      return null;
    }

    // Calculate score and risk
    const score = scoreOpportunity(opportunity, profile);
    const riskFactors = calculateRiskFactors(opportunity);

    // Estimate expected return (annualized spread / 365 for daily)
    const expectedReturn = (opportunity.spread * 100) / 365 * (size / getTotalCapital(profile));

    return {
      opportunity,
      recommendedSize: size,
      exchange: {
        long: opportunity.long_exchange,
        short: opportunity.short_exchange,
      },
      expectedReturn,
      riskScore: riskFactors.overall,
      score,
      reasoning,
    };
  }

  // ============================================================================
  // Target Progress
  // ============================================================================

  /**
   * Check progress toward daily target
   */
  async checkTargetProgress(): Promise<TargetProgress> {
    if (!this.profile) {
      throw new Error('No profile configured. Call setProfile first.');
    }

    const profile = this.profile;
    await this.refreshPositions();

    const currentDailyReturn = this.getCurrentProjectedReturn();
    const progressPercent = profile.dailyTarget > 0
      ? (currentDailyReturn / profile.dailyTarget) * 100
      : 0;

    const totalCapital = getTotalCapital(profile);
    const deployed = getDeployedCapital(this.currentPositions);
    const available = totalCapital - deployed;

    // Estimate positions needed
    const avgReturnPerPosition = this.currentPositions.length > 0
      ? currentDailyReturn / this.currentPositions.length
      : 0.2; // Assume 0.2% per position as default

    const remainingReturn = Math.max(0, profile.dailyTarget - currentDailyReturn);
    const positionsNeeded = avgReturnPerPosition > 0
      ? Math.ceil(remainingReturn / avgReturnPerPosition)
      : 0;

    const suggestions = this.generateTargetSuggestions(
      progressPercent,
      positionsNeeded,
      available
    );

    return {
      dailyTarget: profile.dailyTarget,
      currentDailyReturn,
      progressPercent,
      positionsNeededForTarget: positionsNeeded,
      currentPositions: this.currentPositions,
      totalDeployed: deployed,
      totalAvailable: available,
      suggestions,
    };
  }

  // ============================================================================
  // Position Management
  // ============================================================================

  /**
   * Refresh current positions from API
   */
  async refreshPositions(): Promise<void> {
    try {
      const portfolio = await this.client.getPortfolio();
      this.currentPositions = extractPositionsFromPortfolio(portfolio);
    } catch {
      // Keep existing positions if refresh fails
    }
  }

  /**
   * Get current positions
   */
  getPositions(): CurrentPosition[] {
    return this.currentPositions;
  }

  /**
   * Get diversification analysis
   */
  getDiversificationAnalysis() {
    if (!this.profile) {
      throw new Error('No profile configured');
    }
    return analyzeDiversification(this.currentPositions, this.profile);
  }

  /**
   * Get balance summary
   */
  getBalanceSummary() {
    if (!this.profile) {
      throw new Error('No profile configured');
    }
    return calculateBalanceSummary(this.profile, this.currentPositions);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async fetchAllOpportunities(): Promise<Opportunity[]> {
    if (!this.profile) return [];

    const enabledPairs: ExchangePair[] = [];
    const exchanges = Object.entries(this.profile.exchanges)
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name);

    // Generate all valid exchange pairs
    for (const ex1 of exchanges) {
      for (const ex2 of exchanges) {
        if (ex1 !== ex2) {
          enabledPairs.push(`${ex1}-${ex2}` as ExchangePair);
        }
      }
    }

    const allOpportunities: Opportunity[] = [];

    for (const pair of enabledPairs) {
      try {
        const response = await this.client.getOpportunities({
          exchangepair: pair,
          limit: 20,
          sortby: 'spread',
        });
        allOpportunities.push(...response.opportunities);
      } catch {
        // Skip this pair if it fails
      }
    }

    // Deduplicate by opportunity ID
    const seen = new Set<string>();
    return allOpportunities.filter(opp => {
      if (seen.has(opp.id)) return false;
      seen.add(opp.id);
      return true;
    });
  }

  private getCurrentProjectedReturn(): number {
    return this.currentPositions.reduce(
      (sum, pos) => sum + pos.expectedDailyReturn,
      0
    );
  }

  private generateSummary(
    recommendations: RecommendedOpportunity[],
    expectedReturn: number,
    progressPercent: number,
    utilization: number
  ): string {
    if (recommendations.length === 0 && this.currentPositions.length === 0) {
      return 'No positions and no recommendations. Configure exchanges and balances to get started.';
    }

    if (recommendations.length === 0) {
      return `${this.currentPositions.length} active position(s), ${progressPercent.toFixed(0)}% toward daily target. No new recommendations.`;
    }

    const totalSize = recommendations.reduce((sum, r) => sum + r.recommendedSize, 0);
    return `Found ${recommendations.length} opportunity(ies) for $${totalSize.toFixed(0)}. ` +
      `Expected daily return: ${expectedReturn.toFixed(2)}% (${progressPercent.toFixed(0)}% of target). ` +
      `Capital utilization: ${utilization.toFixed(0)}%.`;
  }

  private generateTargetSuggestions(
    progressPercent: number,
    positionsNeeded: number,
    availableCapital: number
  ): string[] {
    const suggestions: string[] = [];

    if (progressPercent >= 100) {
      suggestions.push('🎯 Daily target reached! Consider holding current positions.');
    } else if (progressPercent >= 75) {
      suggestions.push(`Almost there! Add ${positionsNeeded} more position(s) to hit target.`);
    } else if (progressPercent >= 50) {
      suggestions.push(`Making progress. ${positionsNeeded} more positions needed.`);
    } else {
      suggestions.push(`Need to ramp up. Consider adding ${positionsNeeded} positions.`);
    }

    if (availableCapital < 100) {
      suggestions.push('Low available capital. Consider closing underperforming positions.');
    }

    if (this.currentPositions.length === 0) {
      suggestions.push('No active positions. Open your first position to start earning.');
    }

    return suggestions;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new strategy engine instance
 */
export function createStrategyEngine(client: ZirodeltaClient): StrategyEngine {
  return new StrategyEngine(client);
}

// ============================================================================
// Default Profile
// ============================================================================

/**
 * Get a default agent profile
 */
export function getDefaultProfile(): AgentProfile {
  return {
    balances: {},
    riskProfile: 'moderate',
    dailyTarget: 1.0,
    maxPositionSize: 30,
    maxOpenPositions: 5,
    minSpread: 0.03,
    exchanges: {
      bybit: { enabled: true },
      kucoin: { enabled: true },
    },
    createdAt: new Date().toISOString(),
  };
}
