import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { JupiterService } from "../services/jupiterService.js";
import type { PortfolioData } from "../types.js";
import { SOL_MINT, CACHE_KEYS } from "../types.js";
import { formatUsd } from "../utils.js";

const jupiterService = new JupiterService();

export const priceProvider: Provider = {
  name: "priceProvider",
  description: "Provides current token price data for tracked tokens",

  async get(
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
  ) {
    try {
      const cached = await runtime.getCache<{ data: PortfolioData }>(CACHE_KEYS.PORTFOLIO);
      const portfolio = cached?.data;

      // Always include SOL; add portfolio token mints if available
      const mints = [SOL_MINT];
      if (portfolio?.tokens) {
        for (const t of portfolio.tokens.slice(0, 20)) {
          if (!mints.includes(t.mint)) mints.push(t.mint);
        }
      }

      const prices = await jupiterService.getTokenPrices(mints);
      const tokenMap = await jupiterService.getTokenMap();

      const lines: string[] = ["Current Token Prices:"];
      for (const [mint, price] of prices) {
        const info = tokenMap.get(mint);
        const symbol = mint === SOL_MINT ? "SOL" : (info?.symbol ?? mint.slice(0, 8));
        let line = `  ${symbol}: ${formatUsd(price.price)}`;
        if (price.change24h !== undefined) {
          const sign = price.change24h >= 0 ? "+" : "";
          line += ` (${sign}${price.change24h.toFixed(2)}% 24h)`;
        }
        lines.push(line);
      }

      return {
        text: lines.join("\n"),
        data: { prices: Object.fromEntries(prices) },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { text: `Error fetching price data: ${msg}` };
    }
  },
};
