import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { JupiterService } from "../services/jupiterService.js";
import { formatUsd } from "../utils.js";
import { SOL_MINT } from "../types.js";

const jupiterService = new JupiterService();

const TOKEN_KEYWORDS = [
  "price",
  "cost",
  "worth",
  "value",
  "how much",
  "what's",
  "what is",
  "trading at",
  "current price",
];

export const getTokenPriceAction: Action = {
  name: "GET_TOKEN_PRICE",
  description:
    "Look up the current price of a specific Solana token by name or symbol using Jupiter aggregator data.",
  similes: ["CHECK_PRICE", "TOKEN_PRICE", "PRICE_CHECK", "WHATS_THE_PRICE"],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = (message.content?.text ?? "").toLowerCase();
    return TOKEN_KEYWORDS.some((kw) => text.includes(kw));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<void> => {
    const text = message.content?.text ?? "";

    // Try to extract a token symbol or name from the message
    const tokenQuery = extractTokenQuery(text);

    if (!tokenQuery) {
      await callback?.({
        text: "Which token would you like to check the price of? Please provide a token symbol (e.g., SOL, BONK, JUP) or name.",
      });
      return;
    }

    try {
      // Handle SOL specially
      if (tokenQuery.toUpperCase() === "SOL" || tokenQuery.toLowerCase() === "solana") {
        const prices = await jupiterService.getTokenPrices([SOL_MINT]);
        const solPrice = prices.get(SOL_MINT);
        if (solPrice) {
          await callback?.({
            text: `◎ **SOL (Solana)**: ${formatUsd(solPrice.price)}${solPrice.change24h !== undefined ? ` (${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(2)}% 24h)` : ""}`,
          });
        } else {
          await callback?.({ text: "Unable to fetch SOL price at the moment." });
        }
        return;
      }

      // Search for the token
      const matches = await jupiterService.findTokensByName(tokenQuery);

      if (matches.length === 0) {
        await callback?.({
          text: `I couldn't find a token matching "${tokenQuery}" in the Jupiter verified token list. Try using the exact symbol (e.g., BONK, JUP, RAY).`,
        });
        return;
      }

      // Take the best match (exact symbol match first, then first result)
      const upperQuery = tokenQuery.toUpperCase();
      const exactMatch = matches.find((m) => m.symbol.toUpperCase() === upperQuery);
      const token = exactMatch ?? matches[0];

      const prices = await jupiterService.getTokenPrices([token.address]);
      const price = prices.get(token.address);

      if (!price) {
        await callback?.({
          text: `Found **${token.symbol}** (${token.name}) but couldn't fetch its current price. It might have very low liquidity.`,
        });
        return;
      }

      const lines = [
        `🪙 **${token.symbol}** (${token.name})`,
        `💲 Price: ${formatUsd(price.price)}`,
      ];

      if (price.change24h !== undefined) {
        const emoji = price.change24h >= 0 ? "📈" : "📉";
        const sign = price.change24h >= 0 ? "+" : "";
        lines.push(`${emoji} 24h Change: ${sign}${price.change24h.toFixed(2)}%`);
      }

      lines.push(`📋 Mint: \`${token.address}\``);

      if (matches.length > 1 && !exactMatch) {
        const others = matches
          .slice(1, 4)
          .map((m) => m.symbol)
          .join(", ");
        lines.push(`\n_Other possible matches: ${others}_`);
      }

      await callback?.({ text: lines.join("\n") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await callback?.({
        text: `❌ Error looking up token price: ${msg}`,
      });
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "What's the price of BONK?" },
      },
      {
        name: "assistant",
        content: {
          text: "🪙 **BONK** (Bonk)\n💲 Price: $0.000018",
          actions: ["GET_TOKEN_PRICE"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "How much is SOL worth right now?" },
      },
      {
        name: "assistant",
        content: {
          text: "◎ **SOL (Solana)**: $142.35",
          actions: ["GET_TOKEN_PRICE"],
        },
      },
    ],
  ],
};

/**
 * Extract a likely token symbol or name from user text.
 */
function extractTokenQuery(text: string): string | null {
  // Pattern: "price of X", "X price", "how much is X", "what's X"
  const patterns = [
    /price\s+of\s+(\w+)/i,
    /(\w+)\s+price/i,
    /how\s+much\s+is\s+(\w+)/i,
    /what(?:'s|'s| is)\s+(?:the\s+)?(?:price\s+of\s+)?(\w+)/i,
    /value\s+of\s+(\w+)/i,
    /(\w+)\s+(?:cost|worth|value|trading)/i,
    /check\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].toUpperCase();
      // Filter out common non-token words
      const stopWords = new Set([
        "THE", "A", "AN", "MY", "YOUR", "THIS", "THAT", "IT", "IS",
        "ARE", "WAS", "WERE", "BEEN", "BEING", "HAVE", "HAS", "HAD",
        "DO", "DOES", "DID", "WILL", "WOULD", "SHALL", "SHOULD", "MAY",
        "MIGHT", "MUST", "CAN", "COULD", "CURRENT", "RIGHT", "NOW",
        "TODAY", "TOKEN", "COIN", "CRYPTO",
      ]);
      if (!stopWords.has(candidate)) {
        return match[1];
      }
    }
  }

  return null;
}
