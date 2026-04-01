import type { Transaction } from "../types";

interface Props {
  transactions: Transaction[];
}

const TYPE_ICONS: Record<string, string> = {
  send: "↗",
  receive: "↙",
  swap: "🔄",
  unknown: "•",
};

const TYPE_COLORS: Record<string, string> = {
  send: "text-negative",
  receive: "text-positive",
  swap: "text-secondary",
  unknown: "text-text-muted",
};

function truncateSig(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

export default function TransactionFeed({ transactions }: Props) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 animate-fade-in">
      <h3 className="text-sm font-semibold text-text mb-3">
        Recent Transactions
      </h3>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-text-muted">
          <span className="text-2xl mb-2">📋</span>
          <p className="text-xs">No transactions loaded yet</p>
          <p className="text-xs mt-1">
            Ask the agent to show recent transactions
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {transactions.map((tx, i) => (
            <div
              key={tx.signature || i}
              className="flex items-center gap-2.5 py-1.5 border-b border-border/50 last:border-0"
            >
              <span
                className={`text-lg shrink-0 ${TYPE_COLORS[tx.type] ?? "text-text-muted"}`}
              >
                {TYPE_ICONS[tx.type] ?? "•"}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text truncate">
                  {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  {tx.amount != null && tx.token
                    ? ` ${tx.amount} ${tx.token}`
                    : ""}
                </p>
                <p className="text-[10px] text-text-muted">
                  {tx.timestamp
                    ? new Date(tx.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>

              {tx.signature && (
                <a
                  href={`https://solscan.io/tx/${tx.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-primary/70 hover:text-primary transition-colors shrink-0"
                >
                  {truncateSig(tx.signature)}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
