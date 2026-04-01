import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { buildPortfolio, formatPortfolioText } from "../providers/walletProvider.js";
import { extractSolanaAddress, isValidSolanaAddress, formatUsd } from "../utils.js";
import type { PortfolioData } from "../types.js";

const CACHE_KEY = "solfolio:portfolio";
const CACHE_TTL_MS = 30_000;

export const getPortfolioAction: Action = {
  name: "GET_PORTFOLIO",
  description:
    "Fetch and display the Solana wallet portfolio including SOL balance, token holdings, and USD values. Triggers when a user provides a Solana wallet address or asks about their portfolio.",
  similes: [
    "SHOW_PORTFOLIO",
    "ANALYZE_WALLET",
    "WALLET_SUMMARY",
    "CHECK_WALLET",
    "LOAD_WALLET",
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text ?? "";
    if (extractSolanaAddress(text)) return true;
    const lower = text.toLowerCase();
    return (
      lower.includes("portfolio") ||
      lower.includes("wallet") ||
      lower.includes("balance") ||
      lower.includes("holdings")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<void> => {
    const text = message.content?.text ?? "";
    let address = extractSolanaAddress(text);

    if (!address) {
      address = (await runtime.getCache<string>("solfolio:currentWallet")) ?? null;
    }

    if (!address || !isValidSolanaAddress(address)) {
      await callback?.({
        text: "I need a valid Solana wallet address to look up a portfolio. Please provide one (a base58 string, 32-44 characters).",
        actions: ["GET_PORTFOLIO"],
      });
      return;
    }

    await callback?.({
      text: `Fetching portfolio for \`${address}\`... This may take a moment.`,
    });

    try {
      const portfolio: PortfolioData = await buildPortfolio(address);

      // Persist wallet + portfolio in cache
      await runtime.setCache("solfolio:currentWallet", address);
      await runtime.setCache(CACHE_KEY, {
        data: portfolio,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      const tokenCount = portfolio.tokens.length;
      const topHoldings = portfolio.tokens
        .slice(0, 5)
        .map(
          (t) =>
            `• **${t.symbol}**: ${t.balance.toLocaleString("en-US", { maximumFractionDigits: 4 })} (${formatUsd(t.usdValue)})`,
        )
        .join("\n");

      const summary = [
        `📊 **Portfolio Summary for \`${address.slice(0, 4)}...${address.slice(-4)}\`**`,
        "",
        `💰 **Total Value**: ${formatUsd(portfolio.totalUsdValue)}`,
        `◎ **SOL**: ${portfolio.solBalance.toFixed(4)} SOL (${formatUsd(portfolio.solUsdValue)})`,
        `🪙 **Tokens**: ${tokenCount} different token${tokenCount !== 1 ? "s" : ""}`,
      ];

      if (topHoldings) {
        summary.push("", "**Top Holdings:**", topHoldings);
      }

      if (tokenCount > 5) {
        summary.push(
          "",
          `_...and ${tokenCount - 5} more token${tokenCount - 5 !== 1 ? "s" : ""}. Ask me to analyze your holdings for deeper insights._`,
        );
      }

      await callback?.({
        text: summary.join("\n"),
        actions: ["ANALYZE_HOLDINGS", "GET_TRANSACTIONS"],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await callback?.({
        text: `❌ Error fetching portfolio: ${msg}. Please try again in a moment.`,
      });
    }
  },

  examples: [
    [
      {
        name: "user",
        content: {
          text: "Show me the portfolio for 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        },
      },
      {
        name: "assistant",
        content: {
          text: "📊 Portfolio Summary for `7xKX...AsU`\n\n💰 Total Value: $1,234.56\n◎ SOL: 5.2341 SOL ($523.41)",
          actions: ["GET_PORTFOLIO"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "What's in my wallet?" },
      },
      {
        name: "assistant",
        content: {
          text: "Let me fetch your wallet portfolio...",
          actions: ["GET_PORTFOLIO"],
        },
      },
    ],
  ],
};
