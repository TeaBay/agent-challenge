export interface TokenHolding {
  symbol: string;
  name: string;
  mint: string;
  balance: number;
  usdValue: number;
  allocation: number;
  logoUrl?: string;
  change24h?: number;
}

export interface Transaction {
  signature: string;
  type: "send" | "receive" | "swap" | "unknown";
  timestamp: number;
  amount?: number;
  token?: string;
  description?: string;
}

export interface PortfolioData {
  walletAddress: string;
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  tokens: TokenHolding[];
  transactions: Transaction[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
}
