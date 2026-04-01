import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { SolanaService } from "../services/solanaService.js";
import { JupiterService } from "../services/jupiterService.js";
import type { PortfolioData, TokenBalance } from "../types.js";
import { formatUsd, formatCrypto, extractSolanaAddress, isValidSolanaAddress } from "../utils.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const CACHE_KEY = "solfolio:portfolio";
const CACHE_TTL_MS = 30_000;

const solanaService = new SolanaService();
const jupiterService = new JupiterService();

async function buildPortfolio(address: string): Promise<PortfolioData> {
  const [solBalance, tokenAccounts, tokenMap] = await Promise.all([
    solanaService.getBalance(address),
    solanaService.getTokenAccounts(address),
    jupiterService.getTokenMap(),
  ]);

  const mints = [SOL_MINT, ...tokenAccounts.map((t) => t.mint)];
  const prices = await jupiterService.getTokenPrices(mints);

  const solPrice = prices.get(SOL_MINT)?.price ?? 0;
  const solUsdValue = solBalance * solPrice;

  const tokens: TokenBalance[] = tokenAccounts.map((ta) => {
    const info = tokenMap.get(ta.mint);
    const price = prices.get(ta.mint)?.price ?? 0;
    return {
      mint: ta.mint,
      symbol: info?.symbol ?? "UNKNOWN",
      name: info?.name ?? "Unknown Token",
      balance: ta.balance,
      decimals: ta.decimals,
      usdValue: ta.balance * price,
      logoURI: info?.logoURI,
    };
  });

  // Sort by USD value descending
  tokens.sort((a, b) => b.usdValue - a.usdValue);

  const totalUsdValue = solUsdValue + tokens.reduce((sum, t) => sum + t.usdValue, 0);

  return {
    address,
    solBalance,
    solUsdValue,
    tokens,
    totalUsdValue,
    lastUpdated: Date.now(),
  };
}

function formatPortfolioText(portfolio: PortfolioData): string {
  const lines: string[] = [
    `Wallet: ${portfolio.address}`,
    `Total Value: ${formatUsd(portfolio.totalUsdValue)}`,
    "",
    `SOL: ${formatCrypto(portfolio.solBalance)} (${formatUsd(portfolio.solUsdValue)})`,
  ];

  if (portfolio.tokens.length > 0) {
    lines.push("", "Token Holdings:");
    for (const t of portfolio.tokens.slice(0, 20)) {
      const pct = portfolio.totalUsdValue > 0
        ? ((t.usdValue / portfolio.totalUsdValue) * 100).toFixed(1)
        : "0.0";
      lines.push(
        `  ${t.symbol}: ${formatCrypto(t.balance)} (${formatUsd(t.usdValue)}, ${pct}%)`,
      );
    }
    if (portfolio.tokens.length > 20) {
      lines.push(`  ... and ${portfolio.tokens.length - 20} more tokens`);
    }
  } else {
    lines.push("", "No SPL token holdings found.");
  }

  return lines.join("\n");
}

export const walletProvider: Provider = {
  name: "walletProvider",
  description: "Provides current wallet balances and portfolio data",

  async get(
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
  ) {
    try {
      // Try to extract wallet address from the current message first
      const msgText = message.content?.text ?? "";
      const msgAddress = extractSolanaAddress(msgText);
      if (msgAddress && isValidSolanaAddress(msgAddress)) {
        // Persist for future turns
        await runtime.setCache("solfolio:currentWallet", msgAddress);
      }

      const address = msgAddress ?? (await runtime.getCache<string>("solfolio:currentWallet"));
      if (!address) {
        return { text: "" }; // No wallet in context yet — don't inject anything
      }

      // Check cache
      const cached = await runtime.getCache<{ data: PortfolioData; expiresAt: number }>(CACHE_KEY);
      if (cached && cached.expiresAt > Date.now() && cached.data.address === address) {
        return {
          text: formatPortfolioText(cached.data),
          values: { portfolioLoaded: true, walletAddress: address },
          data: { portfolio: cached.data },
        };
      }

      const portfolio = await buildPortfolio(address);
      await runtime.setCache(CACHE_KEY, { data: portfolio, expiresAt: Date.now() + CACHE_TTL_MS });

      return {
        text: formatPortfolioText(portfolio),
        values: { portfolioLoaded: true, walletAddress: address },
        data: { portfolio },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { text: `Error fetching wallet data: ${msg}` };
    }
  },
};

export { buildPortfolio, formatPortfolioText, solanaService, jupiterService };
