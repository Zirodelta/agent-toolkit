#!/usr/bin/env node

/**
 * Zirodelta TUI Dashboard
 * 
 * Real-time terminal dashboard for monitoring funding rate farming.
 */

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { ZirodeltaClient } from '../sdk/index.js';
import { getToken, getBaseUrl } from '../cli/config.js';
import type { Opportunity, Portfolio, GetFundingFeesResponse, Metrics } from '../sdk/types.js';

// ============================================================================
// Types
// ============================================================================

interface DashboardState {
  opportunities: Opportunity[];
  portfolio: Portfolio | null;
  fundingFees: GetFundingFeesResponse | null;
  metrics: Metrics | null;
  lastUpdate: Date | null;
  error: string | null;
  isRefreshing: boolean;
  selectedExchangePair: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

// ============================================================================
// Dashboard Class
// ============================================================================

export class ZirodeltaDashboard {
  private screen: blessed.Widgets.Screen;
  private grid: contrib.grid;
  private client: ZirodeltaClient;
  private state: DashboardState;
  private refreshInterval: NodeJS.Timeout | null = null;

  // UI Widgets
  private opportunitiesTable!: contrib.Widgets.TableElement;
  private portfolioTable!: contrib.Widgets.TableElement;
  private fundingBox!: blessed.Widgets.BoxElement;
  private statsBox!: blessed.Widgets.BoxElement;
  private statusBar!: blessed.Widgets.BoxElement;
  private helpBox!: blessed.Widgets.BoxElement;

  constructor() {
    // Initialize client
    const token = getToken();
    this.client = new ZirodeltaClient({
      token,
      baseUrl: getBaseUrl(),
    });

    // Initialize state
    this.state = {
      opportunities: [],
      portfolio: null,
      fundingFees: null,
      metrics: null,
      lastUpdate: null,
      error: null,
      isRefreshing: false,
      selectedExchangePair: 'kucoin-bybit',
      connectionStatus: token ? 'disconnected' : 'error',
    };

    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Zirodelta Dashboard',
      fullUnicode: true,
    });

    // Create grid layout
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen,
    });

    this.setupLayout();
    this.setupKeyBindings();
  }

  // ============================================================================
  // Layout Setup
  // ============================================================================

  private setupLayout(): void {
    // Header/Title (row 0, full width)
    this.grid.set(0, 0, 1, 12, blessed.box, {
      content: '{center}{bold}🔥 ZIRODELTA FUNDING RATE DASHBOARD 🔥{/bold}{/center}',
      tags: true,
      style: {
        fg: 'cyan',
        bg: 'black',
        border: { fg: 'cyan' },
      },
      border: { type: 'line' },
    });

    // Opportunities Panel (rows 1-5, left 8 cols)
    this.opportunitiesTable = this.grid.set(1, 0, 5, 8, contrib.table, {
      label: ' 📈 Top Opportunities ',
      keys: true,
      vi: true,
      interactive: true,
      columnSpacing: 2,
      columnWidth: [12, 10, 10, 10, 10, 8],
      style: {
        header: { fg: 'cyan', bold: true },
        cell: { fg: 'white' },
        border: { fg: 'blue' },
      },
      border: { type: 'line' },
    }) as contrib.Widgets.TableElement;

    // Stats Panel (rows 1-3, right 4 cols)
    this.statsBox = this.grid.set(1, 8, 3, 4, blessed.box, {
      label: ' 📊 Stats ',
      tags: true,
      style: {
        fg: 'white',
        border: { fg: 'magenta' },
      },
      border: { type: 'line' },
      padding: { left: 1, right: 1 },
    });

    // Funding Summary (rows 3-5, right 4 cols)
    this.fundingBox = this.grid.set(4, 8, 2, 4, blessed.box, {
      label: ' 💰 Funding Fees ',
      tags: true,
      style: {
        fg: 'white',
        border: { fg: 'yellow' },
      },
      border: { type: 'line' },
      padding: { left: 1, right: 1 },
    });

    // Portfolio Panel (rows 6-10, full width)
    this.portfolioTable = this.grid.set(6, 0, 5, 12, contrib.table, {
      label: ' 💼 Active Positions ',
      keys: true,
      vi: true,
      interactive: false,
      columnSpacing: 2,
      columnWidth: [12, 10, 12, 12, 12, 10, 10, 10],
      style: {
        header: { fg: 'cyan', bold: true },
        cell: { fg: 'white' },
        border: { fg: 'green' },
      },
      border: { type: 'line' },
    }) as contrib.Widgets.TableElement;

    // Status Bar (row 11)
    this.statusBar = this.grid.set(11, 0, 1, 9, blessed.box, {
      tags: true,
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'gray' },
      },
      border: { type: 'line' },
    });

    // Help Bar (row 11, right side)
    this.helpBox = this.grid.set(11, 9, 1, 3, blessed.box, {
      content: '{center}q:Quit r:Refresh p:Pair{/center}',
      tags: true,
      style: {
        fg: 'gray',
        bg: 'black',
        border: { fg: 'gray' },
      },
      border: { type: 'line' },
    });

    // Focus on opportunities table
    this.opportunitiesTable.focus();
  }

  // ============================================================================
  // Key Bindings
  // ============================================================================

  private setupKeyBindings(): void {
    // Quit
    this.screen.key(['q', 'C-c', 'escape'], () => {
      this.stop();
      process.exit(0);
    });

    // Refresh
    this.screen.key(['r', 'R'], () => {
      this.refresh();
    });

    // Toggle exchange pair
    this.screen.key(['p', 'P'], () => {
      this.toggleExchangePair();
    });

    // Tab between panels
    let focusedPanel: 'opportunities' | 'portfolio' = 'opportunities';
    this.screen.key(['tab'], () => {
      if (focusedPanel === 'opportunities') {
        this.portfolioTable.focus();
        focusedPanel = 'portfolio';
      } else {
        this.opportunitiesTable.focus();
        focusedPanel = 'opportunities';
      }
      this.screen.render();
    });
  }

  // ============================================================================
  // Data Fetching
  // ============================================================================

  private async fetchData(): Promise<void> {
    if (this.state.isRefreshing) return;

    this.state.isRefreshing = true;
    this.state.error = null;
    this.updateStatusBar();

    try {
      // Fetch opportunities (public, no auth needed)
      const oppsResponse = await this.client.getOpportunities({
        exchangepair: this.state.selectedExchangePair as any,
        limit: 10,
        sortby: 'spread',
      });
      this.state.opportunities = oppsResponse.opportunities;
      this.state.connectionStatus = 'connected';

      // Fetch portfolio (requires auth)
      if (this.client.isAuthenticated()) {
        try {
          this.state.portfolio = await this.client.getPortfolio();
        } catch (err) {
          // Portfolio may fail without affecting other data
          this.state.portfolio = null;
        }

        try {
          this.state.fundingFees = await this.client.getFundingFees();
        } catch (err) {
          this.state.fundingFees = null;
        }
      }

      // Fetch metrics (public)
      try {
        this.state.metrics = await this.client.getMetrics();
      } catch (err) {
        this.state.metrics = null;
      }

      this.state.lastUpdate = new Date();
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unknown error';
      this.state.connectionStatus = 'error';
    } finally {
      this.state.isRefreshing = false;
      this.render();
    }
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  private render(): void {
    this.renderOpportunities();
    this.renderPortfolio();
    this.renderStats();
    this.renderFunding();
    this.updateStatusBar();
    this.screen.render();
  }

  private renderOpportunities(): void {
    const headers = ['Symbol', 'Spread', 'Long FR', 'Short FR', 'Next Fund', 'Risk'];
    
    if (this.state.opportunities.length === 0) {
      this.opportunitiesTable.setData({
        headers,
        data: [['No opportunities found', '', '', '', '', '']],
      });
      return;
    }

    const data = this.state.opportunities.map((opp, idx) => {
      const spread = this.formatPercent(opp.spread);
      const longFr = this.formatPercent(opp.long_funding_rate);
      const shortFr = this.formatPercent(opp.short_funding_rate);
      const nextFunding = this.formatHoursToFunding(opp.hours_to_funding);
      const risk = this.formatRisk(opp.risk_score);

      // Color the best opportunity
      const symbol = idx === 0 ? `{green-fg}${opp.symbol}{/green-fg}` : opp.symbol;

      return [opp.symbol, spread, longFr, shortFr, nextFunding, risk];
    });

    this.opportunitiesTable.setData({ headers, data });
  }

  private renderPortfolio(): void {
    const headers = ['Symbol', 'Size', 'Entry', 'Mark', 'PnL', 'Funding', 'ROI', 'Status'];

    if (!this.state.portfolio || this.state.portfolio.executions.length === 0) {
      const msg = this.client.isAuthenticated() 
        ? 'No active positions' 
        : 'Login required (set ZIRODELTA_TOKEN)';
      this.portfolioTable.setData({
        headers,
        data: [[msg, '', '', '', '', '', '', '']],
      });
      return;
    }

    const data = this.state.portfolio.executions.map((exec) => {
      const e = exec.execution;
      const pnl = exec.pnl;
      const funding = exec.funding;

      const pnlStr = this.colorPnl(pnl.total_pnl);
      const roiStr = this.colorPercent(pnl.total_pnl_pct);
      const fundingStr = this.colorPnl(funding.net_funding);

      return [
        e.symbol,
        `$${e.input_amount.toFixed(0)}`,
        `$${e.avg_entry_price.toFixed(4)}`,
        `$${exec.long_position.mark_price.toFixed(4)}`,
        pnlStr,
        fundingStr,
        roiStr,
        e.status.toUpperCase(),
      ];
    });

    this.portfolioTable.setData({ headers, data });
  }

  private renderStats(): void {
    const lines: string[] = [];

    if (this.state.metrics) {
      const m = this.state.metrics;
      lines.push(`{cyan-fg}TVL:{/cyan-fg} $${this.formatLargeNumber(m.tvl)}`);
      lines.push(`{cyan-fg}Volume:{/cyan-fg} $${this.formatLargeNumber(m.total_volume)}`);
      lines.push(`{cyan-fg}Trades:{/cyan-fg} ${m.trade_count.toLocaleString()}`);
      lines.push(`{cyan-fg}Avg ROI:{/cyan-fg} ${this.colorPercent(m.average_roi / 100)}`);
      lines.push('');
      lines.push(`{cyan-fg}Running:{/cyan-fg} ${m.running_count}`);
      lines.push(`{cyan-fg}Queued:{/cyan-fg} ${m.queued_count}`);
    } else {
      lines.push('{gray-fg}Loading stats...{/gray-fg}');
    }

    this.statsBox.setContent(lines.join('\n'));
  }

  private renderFunding(): void {
    const lines: string[] = [];

    if (this.state.fundingFees) {
      const f = this.state.fundingFees;
      const net = f.total_received - f.total_paid;
      
      lines.push(`{green-fg}Received:{/green-fg} $${f.total_received.toFixed(2)}`);
      lines.push(`{red-fg}Paid:{/red-fg} $${f.total_paid.toFixed(2)}`);
      lines.push(`{yellow-fg}Net:{/yellow-fg} ${this.colorPnl(net)}`);
    } else if (this.client.isAuthenticated()) {
      lines.push('{gray-fg}Loading...{/gray-fg}');
    } else {
      lines.push('{gray-fg}Login required{/gray-fg}');
    }

    this.fundingBox.setContent(lines.join('\n'));
  }

  private updateStatusBar(): void {
    const statusIcon = this.state.connectionStatus === 'connected' 
      ? '{green-fg}●{/green-fg}' 
      : this.state.connectionStatus === 'error' 
        ? '{red-fg}●{/red-fg}' 
        : '{yellow-fg}●{/yellow-fg}';

    const lastUpdate = this.state.lastUpdate 
      ? this.state.lastUpdate.toLocaleTimeString() 
      : 'Never';

    const refreshing = this.state.isRefreshing ? '{yellow-fg}[Refreshing...]{/yellow-fg} ' : '';

    const error = this.state.error 
      ? `{red-fg}Error: ${this.state.error}{/red-fg}` 
      : '';

    const auth = this.client.isAuthenticated() 
      ? '{green-fg}Authenticated{/green-fg}' 
      : '{yellow-fg}Public Mode{/yellow-fg}';

    const content = `${statusIcon} ${refreshing}Pair: {cyan-fg}${this.state.selectedExchangePair}{/cyan-fg} | ${auth} | Updated: ${lastUpdate} ${error}`;
    
    this.statusBar.setContent(content);
    this.screen.render();
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private formatPercent(n: number): string {
    if (typeof n !== 'number' || isNaN(n)) return 'N/A';
    const value = n * 100;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  private formatHoursToFunding(hours: number): string {
    if (hours < 1) {
      return `${Math.floor(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  }

  private formatRisk(score: number): string {
    if (score <= 3) return '{green-fg}Low{/green-fg}';
    if (score <= 6) return '{yellow-fg}Med{/yellow-fg}';
    return '{red-fg}High{/red-fg}';
  }

  private formatLargeNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
  }

  private colorPnl(n: number): string {
    const formatted = `$${Math.abs(n).toFixed(2)}`;
    if (n > 0) return `{green-fg}+${formatted}{/green-fg}`;
    if (n < 0) return `{red-fg}-${formatted}{/red-fg}`;
    return `{gray-fg}${formatted}{/gray-fg}`;
  }

  private colorPercent(n: number): string {
    const value = n * 100;
    const sign = value >= 0 ? '+' : '';
    const formatted = `${sign}${value.toFixed(2)}%`;
    if (value > 0) return `{green-fg}${formatted}{/green-fg}`;
    if (value < 0) return `{red-fg}${formatted}{/red-fg}`;
    return `{gray-fg}${formatted}{/gray-fg}`;
  }

  private toggleExchangePair(): void {
    const pairs = [
      'kucoin-bybit',
      'bybit-kucoin',
      'hyperliquid-bybit',
      'bybit-hyperliquid',
    ];
    const currentIdx = pairs.indexOf(this.state.selectedExchangePair);
    const nextIdx = (currentIdx + 1) % pairs.length;
    this.state.selectedExchangePair = pairs[nextIdx];
    this.refresh();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  public async refresh(): Promise<void> {
    await this.fetchData();
  }

  public async start(refreshIntervalMs = 30000): Promise<void> {
    // Initial render
    this.render();
    this.screen.render();

    // Initial data fetch
    await this.fetchData();

    // Start auto-refresh
    this.refreshInterval = setInterval(() => {
      this.fetchData();
    }, refreshIntervalMs);

    // Keep running
    this.screen.render();
  }

  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.screen.destroy();
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function runTUI(options: { interval?: number } = {}): Promise<void> {
  const dashboard = new ZirodeltaDashboard();
  const interval = (options.interval || 30) * 1000;

  try {
    await dashboard.start(interval);
  } catch (err) {
    dashboard.stop();
    throw err;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTUI().catch(console.error);
}
