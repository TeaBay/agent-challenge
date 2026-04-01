import type { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { SolanaService } from "../services/solanaService.js";
import type { PortfolioData, TransactionInfo } from "../types.js";
import { CACHE_KEYS } from "../types.js";
import { formatTimestamp, shortenAddress } from "../utils.js";

const solanaService = new SolanaService();

const TX_KEYWORDS = [
  "transaction",
  "transactions",
  "activity",
  "history",
  "recent",
  "transfers",
  "what happened",
  "tx",
  "txs",
];

export const getTransactionsAction: Action = {
  name: "GET_TRANSACTIONS",
  description:
    "Fetch and display recent transactions for the loaded Solana wallet, including transfers, swaps, and staking activity.",
  similes: [
    "RECENT_TRANSACTIONS",
    "TX_HISTORY",
    "SHOW_ACTIVITY",
    "TRANSACTION_HISTORY",
  ],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = (message.content?.text ?? "").toLowerCase();
    const hasTxIntent = TX_KEYWORDS.some((kw) => text.includes(kw));
    if (!hasTxIntent) return false;

    const wallet = await runtime.getCache<string>(CACHE_KEYS.CURRENT_WALLET);
    return !!wallet;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<void> => {
    const address = await runtime.getCache<string>(CACHE_KEYS.CURRENT_WALLET);

    if (!address) {
      await callback?.({
        text: "No wallet is currently loaded. Please provide a Solana wallet address first using the portfolio command.",
        actions: ["GET_PORTFOLIO"],
      });
      return;
    }

    // Parse requested limit from message
    const text = message.content?.text ?? "";
    const limitMatch = text.match(/(\d+)\s*(?:transactions?|txs?|transfers?)/i);
    const limit = limitMatch ? Math.min(parseInt(limitMatch[1], 10), 20) : 10;

    await callback?.({
      text: `Fetching the last ${limit} transactions for \`${shortenAddress(address)}\`...`,
    });

    try {
      const transactions: TransactionInfo[] = await solanaService.getRecentTransactions(
        address,
        limit,
      );

      if (transactions.length === 0) {
        await callback?.({
          text: "No recent transactions found for this wallet.",
        });
        return;
      }

      const typeEmoji: Record<TransactionInfo["type"], string> = {
        transfer: "💸",
        swap: "🔄",
        stake: "🥩",
        unknown: "📝",
      };

      const lines = [
        `📜 **Recent Transactions for \`${shortenAddress(address)}\`**`,
        "",
      ];

      // Group by type for summary
      const typeCounts: Record<string, number> = {};
      for (const tx of transactions) {
        typeCounts[tx.type] = (typeCounts[tx.type] ?? 0) + 1;
      }

      const summaryParts = Object.entries(typeCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
        .join(", ");
      lines.push(`Summary: ${summaryParts}`, "");

      for (const tx of transactions) {
        const emoji = typeEmoji[tx.type];
        const time = formatTimestamp(tx.timestamp);
        let line = `${emoji} **${tx.type.toUpperCase()}** — ${tx.description}`;
        if (tx.amount !== undefined && tx.amount > 0) {
          line += ` (${tx.amount.toFixed(4)} ${tx.token ?? ""})`;
        }
        line += `\n   ${time} · [\`${tx.signature.slice(0, 8)}...\`](https://solscan.io/tx/${tx.signature})`;
        lines.push(line);
      }

      await callback?.({ text: lines.join("\n") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await callback?.({
        text: `❌ Error fetching transactions: ${msg}`,
      });
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Show me recent transactions" },
      },
      {
        name: "assistant",
        content: {
          text: "📜 Recent Transactions for `7xKX...AsU`\n\n💸 TRANSFER — Transfer 1.5000 SOL",
          actions: ["GET_TRANSACTIONS"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "What's the transaction history?" },
      },
      {
        name: "assistant",
        content: {
          text: "Let me fetch the recent activity for your wallet...",
          actions: ["GET_TRANSACTIONS"],
        },
      },
    ],
  ],
};
