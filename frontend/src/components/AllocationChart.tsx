import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TokenHolding } from "../types";
import { formatUsd } from "../api";

interface Props {
  tokens: TokenHolding[];
}

const COLORS = [
  "#14f195", "#9945ff", "#00d1ff", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

export default function AllocationChart({ tokens }: Props) {
  const data = tokens
    .filter((t) => t.allocation > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 8);

  // Group remaining as "Other"
  if (tokens.length > 8) {
    const otherAlloc = tokens
      .slice(8)
      .reduce((sum, t) => sum + t.allocation, 0);
    const otherValue = tokens.slice(8).reduce((sum, t) => sum + t.usdValue, 0);
    if (otherAlloc > 0) {
      data.push({
        symbol: "Other",
        name: "Other",
        mint: "",
        balance: 0,
        usdValue: otherValue,
        allocation: otherAlloc,
      });
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-text mb-3">Allocation</h3>
      <div className="flex items-center gap-4">
        <div className="w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="usdValue"
                nameKey="symbol"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1a1d26",
                  border: "1px solid #2a2d36",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e4e4e7",
                }}
                formatter={(value: number) => [formatUsd(value), "Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-40">
          {data.map((token, i) => (
            <div key={token.symbol} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-text font-medium truncate">
                {token.symbol}
              </span>
              <span className="text-text-muted ml-auto">
                {token.allocation.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
