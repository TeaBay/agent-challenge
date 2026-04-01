import type { PortfolioData } from "../types";
import { formatUsd, truncateAddress } from "../api";

interface Props {
  portfolio: PortfolioData | null;
  loading: boolean;
}

export default function PortfolioSummary({ portfolio, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 w-32 bg-border rounded mb-3" />
        <div className="h-10 w-48 bg-border rounded mb-2" />
        <div className="h-4 w-24 bg-border rounded" />
      </div>
    );
  }

  if (!portfolio) return null;

  const isPositive = portfolio.change24h >= 0;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium mb-1">
            Total Portfolio Value
          </p>
          <p className="text-4xl font-bold text-text tracking-tight">
            {formatUsd(portfolio.totalValue)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`flex items-center gap-0.5 text-sm font-medium ${
                isPositive ? "text-positive" : "text-negative"
              }`}
            >
              <span>{isPositive ? "▲" : "▼"}</span>
              {formatUsd(Math.abs(portfolio.change24h))} (
              {Math.abs(portfolio.change24hPercent).toFixed(1)}%)
            </span>
            <span className="text-text-muted text-xs">24h</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-text-muted text-xs mb-1">Wallet</p>
          <p className="text-sm font-mono text-text/80">
            {truncateAddress(portfolio.walletAddress, 6)}
          </p>
          <p className="text-text-muted text-xs mt-2">
            {portfolio.tokens.length} token{portfolio.tokens.length !== 1 && "s"}
          </p>
        </div>
      </div>
    </div>
  );
}
