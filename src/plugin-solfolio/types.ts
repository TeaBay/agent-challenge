export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  logoURI?: string;
}

export interface PortfolioData {
  address: string;
  solBalance: number;
  solUsdValue: number;
  tokens: TokenBalance[];
  totalUsdValue: number;
  lastUpdated: number;
}

export interface TokenPrice {
  mint: string;
  price: number;
  change24h?: number;
}

export interface TransactionInfo {
  signature: string;
  timestamp: number;
  type: "transfer" | "swap" | "stake" | "unknown";
  description: string;
  amount?: number;
  token?: string;
}

export interface JupiterTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export const CACHE_KEYS = {
  PORTFOLIO: "solfolio:portfolio",
  CURRENT_WALLET: "solfolio:currentWallet",
} as const;

export const PORTFOLIO_CACHE_TTL_MS = 30_000;
