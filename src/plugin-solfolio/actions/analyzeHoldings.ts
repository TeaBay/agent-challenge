import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import type { PortfolioData } from "../types.js";
import { formatUsd } from "../utils.js";

const ANALYSIS_KEYWORDS = [
  "analyze",
  "analysis",
  "insight",
  "diversif",
  "risk",
  "risky",
  "suggest",
  "advice",
  "recommend",
  "concentrated",
  "safe",
  "health",
  "breakdown",
  "allocation",
];

export const analyzeHoldingsAction: Action = {
  name: "ANALYZE_HOLDINGS",
  description:
    "Analyze the loaded portfolio for concentration risk, diversification, and provide qualitative insights about the wallet's holdings.",
  similes: [
    "PORTFOLIO_INSIGHTS",
    "RISK_ANALYSIS",
    "HOLDING_ANALYSIS",
  ],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = (message.content?.text ?? "").toLowerCase();
    const hasAnalysisIntent = ANALYSIS_KEYWORDS.some((kw) => text.includes(kw));
    if (!hasAnalysisIntent) return false;

    const cached = await runtime.getCache<{ data: PortfolioData }>("solfolio:portfolio");
    return !!cached?.data;
  },

  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<void> => {
    const cached = await runtime.getCache<{ data: PortfolioData }>("solfolio:portfolio");
    const portfolio = cached?.data;

    if (!portfolio) {
      await callback?.({
        text: "No portfolio data loaded. Please provide a Solana wallet address first so I can analyze the holdings.",
        actions: ["GET_PORTFOLIO"],
      });
      return;
    }

    try {
      const analysis = computeAnalysis(portfolio);

      const lines = [
        `🔍 **Portfolio Analysis for \`${portfolio.address.slice(0, 4)}...${portfolio.address.slice(-4)}\`**`,
        "",
        `💰 **Total Value**: ${formatUsd(portfolio.totalUsdValue)}`,
        "",
      ];

      // Allocation breakdown
      lines.push("**📊 Allocation Breakdown:**");
      const solPct = portfolio.totalUsdValue > 0
        ? (portfolio.solUsdValue / portfolio.totalUsdValue) * 100
        : 0;
      lines.push(`  ◎ SOL: ${solPct.toFixed(1)}%`);

      for (const holding of analysis.topHoldings) {
        lines.push(`  🪙 ${holding.symbol}: ${holding.percentage.toFixed(1)}%`);
      }
      if (analysis.otherCount > 0) {
        lines.push(`  📦 Other (${analysis.otherCount} tokens): ${analysis.otherPercentage.toFixed(1)}%`);
      }

      // Concentration metrics
      lines.push("", "**📏 Concentration Metrics:**");
      lines.push(`  • Top holding: ${analysis.topConcentration.toFixed(1)}% (${analysis.topAsset})`);
      lines.push(`  • Top 3 holdings: ${analysis.top3Concentration.toFixed(1)}%`);
      lines.push(`  • HHI (Herfindahl Index): ${analysis.hhi.toFixed(0)} / 10,000`);
      lines.push(`  • Effective # of positions: ${analysis.effectivePositions.toFixed(1)}`);

      // Risk assessment
      lines.push("", `**⚠️ Risk Assessment: ${analysis.riskLevel}**`);
      for (const note of analysis.riskNotes) {
        lines.push(`  ${note}`);
      }

      // Suggestions
      if (analysis.suggestions.length > 0) {
        lines.push("", "**💡 Suggestions:**");
        for (const suggestion of analysis.suggestions) {
          lines.push(`  • ${suggestion}`);
        }
      }

      await callback?.({ text: lines.join("\n") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await callback?.({
        text: `❌ Error analyzing holdings: ${msg}`,
      });
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Is my portfolio diversified?" },
      },
      {
        name: "assistant",
        content: {
          text: "🔍 Portfolio Analysis...\n\n📊 Allocation Breakdown:\n  ◎ SOL: 65.0%\n\n⚠️ Risk Assessment: Moderate",
          actions: ["ANALYZE_HOLDINGS"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "Analyze my holdings for risk" },
      },
      {
        name: "assistant",
        content: {
          text: "Let me analyze your portfolio composition...",
          actions: ["ANALYZE_HOLDINGS"],
        },
      },
    ],
  ],
};

interface AnalysisResult {
  topHoldings: { symbol: string; percentage: number }[];
  otherCount: number;
  otherPercentage: number;
  topConcentration: number;
  topAsset: string;
  top3Concentration: number;
  hhi: number;
  effectivePositions: number;
  riskLevel: string;
  riskNotes: string[];
  suggestions: string[];
}

function computeAnalysis(portfolio: PortfolioData): AnalysisResult {
  const total = portfolio.totalUsdValue;
  if (total === 0) {
    return {
      topHoldings: [],
      otherCount: 0,
      otherPercentage: 0,
      topConcentration: 0,
      topAsset: "N/A",
      top3Concentration: 0,
      hhi: 0,
      effectivePositions: 0,
      riskLevel: "⬜ Empty",
      riskNotes: ["This wallet has no value."],
      suggestions: ["Fund this wallet to start building a portfolio."],
    };
  }

  // Build allocation list (SOL + tokens)
  const allocations: { symbol: string; usdValue: number; pct: number }[] = [];
  allocations.push({
    symbol: "SOL",
    usdValue: portfolio.solUsdValue,
    pct: (portfolio.solUsdValue / total) * 100,
  });
  for (const t of portfolio.tokens) {
    allocations.push({
      symbol: t.symbol,
      usdValue: t.usdValue,
      pct: (t.usdValue / total) * 100,
    });
  }
  allocations.sort((a, b) => b.pct - a.pct);

  // Top holdings (show up to 5)
  const topHoldings = allocations.slice(0, 5).map((a) => ({
    symbol: a.symbol,
    percentage: a.pct,
  }));
  const otherAllocations = allocations.slice(5);
  const otherPercentage = otherAllocations.reduce((sum, a) => sum + a.pct, 0);

  // Concentration metrics
  const topConcentration = allocations[0]?.pct ?? 0;
  const topAsset = allocations[0]?.symbol ?? "N/A";
  const top3Concentration = allocations.slice(0, 3).reduce((sum, a) => sum + a.pct, 0);

  // HHI: sum of squared percentage shares (max 10,000 for single asset)
  const hhi = allocations.reduce((sum, a) => sum + a.pct * a.pct, 0);

  // Effective number of positions (inverse HHI normalized)
  const effectivePositions = hhi > 0 ? 10000 / hhi : 0;

  // Risk assessment
  const riskNotes: string[] = [];
  const suggestions: string[] = [];
  let riskLevel: string;

  if (topConcentration > 80) {
    riskLevel = "🔴 High — Extremely concentrated";
    riskNotes.push(`${topAsset} makes up ${topConcentration.toFixed(1)}% of the portfolio.`);
    suggestions.push("Consider diversifying into other assets to reduce single-asset risk.");
  } else if (topConcentration > 50) {
    riskLevel = "🟠 Moderate-High — Concentrated";
    riskNotes.push(`${topAsset} dominates at ${topConcentration.toFixed(1)}%.`);
    if (top3Concentration > 90) {
      riskNotes.push("Top 3 holdings represent over 90% of value.");
    }
    suggestions.push("The portfolio is heavily weighted. Consider spreading exposure.");
  } else if (top3Concentration > 80) {
    riskLevel = "🟡 Moderate — Somewhat concentrated";
    riskNotes.push("The top 3 holdings represent most of the value.");
    suggestions.push("Good primary positions; consider adding a few more diversified holdings.");
  } else {
    riskLevel = "🟢 Low — Well diversified";
    riskNotes.push("Holdings are spread across multiple assets.");
  }

  // Micro-cap / dust detection
  const dustTokens = portfolio.tokens.filter((t) => t.usdValue > 0 && t.usdValue < 1);
  if (dustTokens.length > 5) {
    riskNotes.push(`${dustTokens.length} dust tokens detected (< $1 each).`);
    suggestions.push("Consider cleaning up dust positions to simplify your portfolio.");
  }

  // Zero-value tokens (possible scam / airdrop)
  const zeroValueTokens = portfolio.tokens.filter((t) => t.usdValue === 0);
  if (zeroValueTokens.length > 3) {
    riskNotes.push(`${zeroValueTokens.length} tokens with no market value (possibly scam airdrops).`);
    suggestions.push("Be cautious with unknown zero-value tokens — some may be scam airdrops.");
  }

  // SOL-heavy check
  const solPct = (portfolio.solUsdValue / total) * 100;
  if (solPct < 10 && total > 100) {
    suggestions.push("Low SOL balance. Keep some SOL for transaction fees.");
  }

  return {
    topHoldings,
    otherCount: otherAllocations.length,
    otherPercentage,
    topConcentration,
    topAsset,
    top3Concentration,
    hhi,
    effectivePositions,
    riskLevel,
    riskNotes,
    suggestions,
  };
}
