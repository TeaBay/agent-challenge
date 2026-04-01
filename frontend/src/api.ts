import { type PortfolioData, type TokenHolding, type Transaction } from "./types";

const API_BASE = "/api";

let cachedAgentId: string | null = null;

export async function getAgentId(): Promise<string> {
  if (cachedAgentId) return cachedAgentId;

  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");

  const data = await res.json();

  // ElizaOS returns { agents: [...] } or an object keyed by id
  let agents: { id: string }[] = [];
  if (Array.isArray(data)) {
    agents = data;
  } else if (data.agents && Array.isArray(data.agents)) {
    agents = data.agents;
  } else if (typeof data === "object") {
    agents = Object.values(data).flat() as { id: string }[];
  }

  if (agents.length === 0) throw new Error("No agents found");
  cachedAgentId = agents[0].id;
  return cachedAgentId!;
}

export async function sendMessage(
  agentId: string,
  text: string,
  userId = "user1",
  roomId = "default"
): Promise<{ text: string; action?: string }[]> {
  const res = await fetch(`${API_BASE}/${agentId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, userId, roomId }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function parsePortfolioFromResponse(text: string): Partial<PortfolioData> | null {
  try {
    const totalMatch = text.match(/\$([0-9,]+\.?\d*)/);
    const totalValue = totalMatch
      ? parseFloat(totalMatch[1].replace(/,/g, ""))
      : 0;

    const tokenRegex =
      /[-•]\s*(\w+):\s*([\d,]+\.?\d*)\s*\(\$?([\d,]+\.?\d*)\s*[—–-]\s*([\d.]+)%\)/g;
    const tokens: TokenHolding[] = [];
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      tokens.push({
        symbol: match[1],
        name: match[1],
        mint: "",
        balance: parseFloat(match[2].replace(/,/g, "")),
        usdValue: parseFloat(match[3].replace(/,/g, "")),
        allocation: parseFloat(match[4]),
      });
    }

    const changeMatch = text.match(/([+-]?\d+\.?\d*)%\s*(?:change|in the last)/i);
    const change24hPercent = changeMatch ? parseFloat(changeMatch[1]) : 0;

    if (totalValue > 0 || tokens.length > 0) {
      return {
        totalValue,
        change24h: totalValue * (change24hPercent / 100),
        change24hPercent,
        tokens,
        transactions: [],
      };
    }
  } catch {
    // parsing failed
  }
  return null;
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function truncateAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}
