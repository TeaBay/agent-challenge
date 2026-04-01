import type { TokenPrice, JupiterTokenInfo } from "../types.js";

const PRICE_API = "https://api.jup.ag/price/v2";
const TOKEN_LIST_URL = "https://token.jup.ag/strict";

const PRICE_CACHE_TTL_MS = 30_000;
const TOKEN_LIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface PriceResponse {
  data: Record<
    string,
    {
      id: string;
      type: string;
      price: string;
    } | null
  >;
}

export class JupiterService {
  private priceCache = new Map<string, { price: TokenPrice; expiresAt: number }>();
  private tokenListCache: { tokens: JupiterTokenInfo[]; expiresAt: number } | null = null;
  private tokenMapCache: Map<string, JupiterTokenInfo> | null = null;

  async getTokenPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();
    const now = Date.now();
    const toFetch: string[] = [];

    for (const mint of mints) {
      const cached = this.priceCache.get(mint);
      if (cached && cached.expiresAt > now) {
        results.set(mint, cached.price);
      } else {
        toFetch.push(mint);
      }
    }

    if (toFetch.length > 0) {
      const freshPrices = await this.fetchPrices(toFetch);
      for (const [mint, price] of freshPrices) {
        this.priceCache.set(mint, { price, expiresAt: now + PRICE_CACHE_TTL_MS });
        results.set(mint, price);
      }
    }

    return results;
  }

  private async fetchPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();

    // Jupiter price API supports batch queries
    const batchSize = 100;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const ids = batch.join(",");
      const url = `${PRICE_API}?ids=${ids}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Jupiter price API returned ${response.status}`);
          continue;
        }
        const json = (await response.json()) as PriceResponse;

        for (const mint of batch) {
          const entry = json.data[mint];
          if (entry && entry.price) {
            results.set(mint, {
              mint,
              price: parseFloat(entry.price),
            });
          }
        }
      } catch (err) {
        console.error("Jupiter price fetch error:", err);
      }
    }

    return results;
  }

  async getTokenList(): Promise<JupiterTokenInfo[]> {
    const now = Date.now();
    if (this.tokenListCache && this.tokenListCache.expiresAt > now) {
      return this.tokenListCache.tokens;
    }

    try {
      const response = await fetch(TOKEN_LIST_URL);
      if (!response.ok) {
        throw new Error(`Token list fetch failed: ${response.status}`);
      }
      const tokens = (await response.json()) as JupiterTokenInfo[];
      this.tokenListCache = { tokens, expiresAt: now + TOKEN_LIST_CACHE_TTL_MS };
      this.tokenMapCache = null; // reset derived cache
      return tokens;
    } catch (err) {
      // Return cached data even if expired rather than failing
      if (this.tokenListCache) {
        return this.tokenListCache.tokens;
      }
      console.error("Failed to fetch token list:", err);
      return [];
    }
  }

  async getTokenMap(): Promise<Map<string, JupiterTokenInfo>> {
    if (this.tokenMapCache) return this.tokenMapCache;

    const tokens = await this.getTokenList();
    const map = new Map<string, JupiterTokenInfo>();
    for (const t of tokens) {
      map.set(t.address, t);
    }
    this.tokenMapCache = map;
    return map;
  }

  async findTokenBySymbol(symbol: string): Promise<JupiterTokenInfo | undefined> {
    const tokens = await this.getTokenList();
    const upper = symbol.toUpperCase();
    return tokens.find((t) => t.symbol.toUpperCase() === upper);
  }

  async findTokensByName(query: string): Promise<JupiterTokenInfo[]> {
    const tokens = await this.getTokenList();
    const lower = query.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lower) ||
        t.name.toLowerCase().includes(lower),
    );
  }
}
