import type { Plugin } from "@elizaos/core";
import { getPortfolioAction } from "./actions/getPortfolio.js";
import { getTokenPriceAction } from "./actions/getTokenPrice.js";
import { getTransactionsAction } from "./actions/getTransactions.js";
import { analyzeHoldingsAction } from "./actions/analyzeHoldings.js";
import { walletProvider } from "./providers/walletProvider.js";
import { priceProvider } from "./providers/priceProvider.js";

export const solfolioPlugin: Plugin = {
  name: "plugin-solfolio",
  description:
    "Solana portfolio intelligence plugin — wallet analysis, token prices, transaction history, and risk insights",
  actions: [
    getPortfolioAction,
    getTokenPriceAction,
    getTransactionsAction,
    analyzeHoldingsAction,
  ],
  providers: [walletProvider, priceProvider],
  evaluators: [],
};

export default solfolioPlugin;
