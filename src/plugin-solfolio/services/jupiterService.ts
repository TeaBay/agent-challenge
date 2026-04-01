import type { TokenPrice, JupiterTokenInfo } from "../types.js";

const COINGECKO_PRICE_API = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_CONTRACT_API = "https://api.coingecko.com/api/v3/simple/token_price/solana";
const TOKEN_LIST_URL = "https://api.jup.ag/tokens/v1/mints/tradable";

const PRICE_CACHE_TTL_MS = 30_000;
const TOKEN_LIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Well-known Solana token registry (fallback when API unavailable)
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; logoURI?: string }> = {
  "So11111111111111111111111111111111111111112": { symbol: "SOL", name: "Solana" },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", name: "USD Coin" },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", name: "Tether USD" },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", name: "Bonk" },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": { symbol: "JUP", name: "Jupiter" },
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": { symbol: "ETH", name: "Ethereum (Wormhole)" },
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh": { symbol: "WBTC", name: "Wrapped Bitcoin" },
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": { symbol: "RAY", name: "Raydium" },
  "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": { symbol: "ORCA", name: "Orca" },
  "HZ1JovNiVvGrCNiiYWY1HjdFJRRVZ9dFl56MFB6YXZQ8": { symbol: "PYTH", name: "Pyth Network" },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": { symbol: "mSOL", name: "Marinade staked SOL" },
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": { symbol: "stSOL", name: "Lido Staked SOL" },
  "CKaKtYvz6dKPyMvYq9Rh3UBrnNqYZAyd7iF4hJtjUvks": { symbol: "GST", name: "Green Satoshi Token" },
  "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB": { symbol: "GST-SOL", name: "GST-SOL" },
  "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6": { symbol: "KIN", name: "Kin" },
  "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt": { symbol: "SRM", name: "Serum" },
  "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E": { symbol: "BTC", name: "Bitcoin (Sollet)" },
  "2FPyTwcZLUgr5Th81UT23NMZYvNF5Dl24nzFpg2oe4DL": { symbol: "soETH", name: "Ethereum (Sollet)" },
  "Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1": { symbol: "SBR", name: "Saber" },
  "MNGO3XjXAJoGxiFsurely7d1b4t5nZFAjGZ1i7": { symbol: "MNGO", name: "Mango" },
};

// CoinGecko ID map for common Solana tokens
const COINGECKO_IDS: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "solana",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "usd-coin",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "tether",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "bonk",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "jupiter-exchange-solana",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "raydium",
  "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": "orca",
  "HZ1JovNiVvGrCNiiYWY1HjdFJRRVZ9dFl56MFB6YXZQ8": "pyth-network",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "marinade-staked-sol",
};

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

    // Separate mints into known (CoinGecko ID exists) and contract-based
    const knownIds: string[] = [];
    const knownMints: string[] = [];
    const contractMints: string[] = [];

    for (const mint of mints) {
      const cgId = COINGECKO_IDS[mint];
      if (cgId) {
        knownIds.push(cgId);
        knownMints.push(mint);
      } else {
        contractMints.push(mint);
      }
    }

    // Fetch prices for known tokens via CoinGecko IDs
    if (knownIds.length > 0) {
      try {
        const url = `${COINGECKO_PRICE_API}?ids=${knownIds.join(",")}&vs_currencies=usd`;
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          const json = (await response.json()) as Record<string, { usd: number }>;
          for (let i = 0; i < knownMints.length; i++) {
            const mint = knownMints[i];
            const cgId = knownIds[i];
            const price = json[cgId]?.usd;
            if (price) {
              results.set(mint, { mint, price });
            }
          }
        }
      } catch (err) {
        console.error("CoinGecko ID price fetch error:", err);
      }
    }

    // Fetch prices for other tokens via CoinGecko contract address API
    if (contractMints.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < contractMints.length; i += batchSize) {
        const batch = contractMints.slice(i, i + batchSize);
        try {
          const url = `${COINGECKO_CONTRACT_API}?contract_addresses=${batch.join(",")}&vs_currencies=usd`;
          const response = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (response.ok) {
            const json = (await response.json()) as Record<string, { usd?: number }>;
            for (const mint of batch) {
              const price = json[mint.toLowerCase()]?.usd;
              if (price) {
                results.set(mint, { mint, price });
              }
            }
          }
        } catch (err) {
          console.error("CoinGecko contract price fetch error:", err);
        }
      }
    }

    return results;
  }

  async getTokenList(): Promise<JupiterTokenInfo[]> {
    const now = Date.now();
    if (this.tokenListCache && this.tokenListCache.expiresAt > now) {
      return this.tokenListCache.tokens;
    }

    // Return hardcoded known tokens as fallback first, then try to fetch
    const fallback: JupiterTokenInfo[] = Object.entries(KNOWN_TOKENS).map(([address, info]) => ({
      address,
      symbol: info.symbol,
      name: info.name,
      decimals: 6,
      logoURI: info.logoURI,
      tags: [],
    }));

    try {
      const response = await fetch(TOKEN_LIST_URL, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Token list fetch failed: ${response.status}`);
      }
      // New API returns array of mint addresses, not full token info
      const mints = (await response.json()) as string[];
      // Build minimal token info — names/symbols are in known map or unknown
      const tokens: JupiterTokenInfo[] = mints.map((address) => {
        const known = KNOWN_TOKENS[address];
        return {
          address,
          symbol: known?.symbol ?? address.slice(0, 6),
          name: known?.name ?? "Unknown Token",
          decimals: 6,
          logoURI: known?.logoURI,
          tags: [],
        };
      });
      this.tokenListCache = { tokens, expiresAt: now + TOKEN_LIST_CACHE_TTL_MS };
      this.tokenMapCache = null;
      return tokens;
    } catch (err) {
      console.error("Failed to fetch token list, using fallback:", (err as Error).message);
      // Use hardcoded fallback
      if (!this.tokenListCache) {
        this.tokenListCache = { tokens: fallback, expiresAt: now + PRICE_CACHE_TTL_MS };
        this.tokenMapCache = null;
      }
      return this.tokenListCache.tokens;
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
