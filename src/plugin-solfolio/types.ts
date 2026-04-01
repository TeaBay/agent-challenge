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
