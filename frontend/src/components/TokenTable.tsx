import { useState, useMemo } from "react";
import type { TokenHolding } from "../types";
import { formatUsd } from "../api";

interface Props {
  tokens: TokenHolding[];
}

type SortField = "usdValue" | "allocation" | "balance" | "symbol";

const COLORS = [
  "#14f195", "#9945ff", "#00d1ff", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

export default function TokenTable({ tokens }: Props) {
  const [sortField, setSortField] = useState<SortField>("usdValue");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === "symbol") return mul * a.symbol.localeCompare(b.symbol);
      return mul * (a[sortField] - b[sortField]);
    });
  }, [tokens, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-text-muted">
      {sortField === field ? (sortAsc ? "↑" : "↓") : ""}
    </span>
  );

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text">Token Holdings</h3>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
              <th className="text-left px-4 py-2.5">#</th>
              <th
                className="text-left px-4 py-2.5 cursor-pointer hover:text-text transition-colors"
                onClick={() => handleSort("symbol")}
              >
                Token <SortIcon field="symbol" />
              </th>
              <th
                className="text-right px-4 py-2.5 cursor-pointer hover:text-text transition-colors"
                onClick={() => handleSort("balance")}
              >
                Balance <SortIcon field="balance" />
              </th>
              <th
                className="text-right px-4 py-2.5 cursor-pointer hover:text-text transition-colors"
                onClick={() => handleSort("usdValue")}
              >
                Value <SortIcon field="usdValue" />
              </th>
              <th
                className="text-right px-4 py-2.5 cursor-pointer hover:text-text transition-colors"
                onClick={() => handleSort("allocation")}
              >
                Alloc. <SortIcon field="allocation" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((token, i) => (
              <tr
                key={token.symbol + i}
                className="border-b border-border/50 hover:bg-border/20 transition-colors"
              >
                <td className="px-4 py-2.5 text-text-muted">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-bg shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <span className="font-medium text-text">{token.symbol}</span>
                      {token.name !== token.symbol && (
                        <span className="text-text-muted ml-1.5 text-xs">
                          {token.name}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-text/80">
                  {token.balance.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-text">
                  {formatUsd(token.usdValue)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(token.allocation, 100)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-text-muted text-xs w-12 text-right">
                      {token.allocation.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
