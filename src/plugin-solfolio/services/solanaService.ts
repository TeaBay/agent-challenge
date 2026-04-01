import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
  type TokenAmount,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { TransactionInfo } from "../types.js";

const RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
}

export interface ParsedTokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  tokenAmount: TokenAmount;
}

export class SolanaService {
  private connections: Connection[];
  private activeIndex = 0;

  constructor() {
    this.connections = RPC_URLS.map(
      (url) => new Connection(url, { commitment: "confirmed" }),
    );
  }

  private get connection(): Connection {
    return this.connections[this.activeIndex];
  }

  private rotateRpc(): void {
    this.activeIndex = (this.activeIndex + 1) % this.connections.length;
  }

  private async call<T>(label: string, fn: (conn: Connection) => Promise<T>): Promise<T> {
    try {
      // Retry against the current RPC MAX_RETRIES times before rotating
      return await withRetry(() => fn(this.connection), label);
    } catch (err) {
      // All retries exhausted — rotate to next RPC for subsequent calls
      this.rotateRpc();
      throw err;
    }
  }

  async getBalance(address: string): Promise<number> {
    const pubkey = new PublicKey(address);
    const lamports = await this.call("getBalance", (c) => c.getBalance(pubkey));
    return lamports / 1e9;
  }

  async getTokenAccounts(address: string): Promise<ParsedTokenAccount[]> {
    const pubkey = new PublicKey(address);
    const response = await this.call("getTokenAccounts", (c) =>
      c.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
    );

    return response.value
      .map((account) => {
        const parsed = account.account.data.parsed?.info;
        if (!parsed) return null;
        const tokenAmount: TokenAmount = parsed.tokenAmount;
        return {
          mint: parsed.mint as string,
          balance: Number(tokenAmount.uiAmount ?? 0),
          decimals: tokenAmount.decimals,
          tokenAmount,
        };
      })
      .filter((t): t is ParsedTokenAccount => t !== null && t.balance > 0);
  }

  async getRecentTransactions(
    address: string,
    limit = 10,
  ): Promise<TransactionInfo[]> {
    const pubkey = new PublicKey(address);
    const signatures = await this.call("getSignatures", (c) =>
      c.getSignaturesForAddress(pubkey, { limit }),
    );

    if (signatures.length === 0) return [];

    const sigs = signatures.map((s) => s.signature);
    const txs = await this.call("getParsedTransactions", (c) =>
      c.getParsedTransactions(sigs, { maxSupportedTransactionVersion: 0 }),
    );

    return txs
      .map((tx, i) => this.parseTransaction(tx, signatures[i].signature))
      .filter((t): t is TransactionInfo => t !== null);
  }

  private parseTransaction(
    tx: ParsedTransactionWithMeta | null,
    signature: string,
  ): TransactionInfo | null {
    if (!tx) return null;

    const blockTime = tx.blockTime ?? Math.floor(Date.now() / 1000);
    const instructions = tx.transaction.message.instructions;

    let type: TransactionInfo["type"] = "unknown";
    let description = "Unknown transaction";
    let amount: number | undefined;
    let token: string | undefined;

    for (const ix of instructions) {
      if (!("parsed" in ix)) continue;
      const parsed = ix.parsed;
      if (!parsed || typeof parsed !== "object") continue;

      const pType = parsed.type as string | undefined;
      const info = parsed.info as Record<string, unknown> | undefined;

      if (pType === "transfer" || pType === "transferChecked") {
        type = "transfer";
        const tokenAmountInfo = info?.tokenAmount as Record<string, unknown> | undefined;
        amount = Number(info?.lamports ?? tokenAmountInfo?.uiAmount ?? 0);
        if (info?.lamports) amount /= 1e9;
        token = (info?.mint as string) ?? "SOL";
        description = `Transfer ${formatCrypto(amount)} ${token === "SOL" ? "SOL" : "tokens"}`;
        break;
      }
    }

    // Heuristic: if multiple program interactions and one is a known DEX
    if (type === "unknown" && instructions.length > 2) {
      const programIds = instructions.map((ix) =>
        "programId" in ix ? ix.programId.toBase58() : "",
      );
      const dexPrograms = [
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter v6
        "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpool
        "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM
      ];
      if (programIds.some((id) => dexPrograms.includes(id))) {
        type = "swap";
        description = "Token swap";
      }
    }

    // Stake detection
    if (type === "unknown") {
      const programIds = instructions.map((ix) =>
        "programId" in ix ? ix.programId.toBase58() : "",
      );
      if (programIds.includes("Stake11111111111111111111111111111111111111")) {
        type = "stake";
        description = "Staking operation";
      }
    }

    return { signature, timestamp: blockTime, type, description, amount, token };
  }
}

function formatCrypto(value: number): string {
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(6);
  return value.toExponential(2);
}
