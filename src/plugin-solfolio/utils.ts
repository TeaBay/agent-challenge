import { PublicKey } from "@solana/web3.js";

/**
 * Format a number as USD currency string.
 */
export function formatUsd(value: number): string {
  if (value >= 0.01 || value === 0) {
    return "$" + value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  // Very small values
  return "$" + value.toFixed(6);
}

/**
 * Format a crypto amount with appropriate decimal places.
 */
export function formatCrypto(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(6);
  return value.toExponential(2);
}

/**
 * Extract a Solana address (base58, 32-44 chars) from text.
 */
export function extractSolanaAddress(text: string): string | null {
  const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  return match ? match[0] : null;
}

/**
 * Validate a Solana address — must be a valid Ed25519 public key (32 bytes).
 * Uses PublicKey constructor which rejects Bitcoin addresses and other non-Solana base58.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a Unix timestamp to a human-readable string.
 */
export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shorten a Solana address for display.
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
