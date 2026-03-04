import type { Pool } from "@starkyield/shared";
import { logger } from "../utils/logger.js";

interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  apy: number | null;
  apyPct1D?: number | null;
  tvlUsd: number | null;
  ilRisk?: string | null;
}

interface DefiLlamaResponse {
  data: DefiLlamaPool[];
}

export class PoolService {
  private static readonly MIN_TVL_USD = 10_000;
  private static readonly MIN_APR = 1;
  private static readonly MAX_POOLS = 50;
  private static readonly ALLOWED_BASE_ASSETS = new Set(["ETH", "WETH", "STRK"]);

  private includesTargetAsset(symbol: string): boolean {
    const parts = symbol
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter(Boolean);
    return parts.some((part) => PoolService.ALLOWED_BASE_ASSETS.has(part));
  }

  private mapRisk(ilRisk: string | null | undefined): Pool["risk"] {
    const value = (ilRisk ?? "").toLowerCase();
    if (value.includes("yes") || value.includes("high")) {
      return "High";
    }
    if (value.includes("medium")) {
      return "Medium";
    }
    return "Low";
  }

  private async fetchStarknetPools(): Promise<Pool[]> {
    const response = await fetch("https://yields.llama.fi/pools", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pools: ${response.status}`);
    }

    const payload = (await response.json()) as DefiLlamaResponse;
    return payload.data
      .filter((pool): pool is DefiLlamaPool & { apy: number } => {
        const apr = typeof pool.apy === "number" ? pool.apy : null;
        const tvl = typeof pool.tvlUsd === "number" ? pool.tvlUsd : 0;
        return (
          pool.chain.toLowerCase() === "starknet" &&
          this.includesTargetAsset(pool.symbol) &&
          apr !== null &&
          apr >= PoolService.MIN_APR &&
          tvl >= PoolService.MIN_TVL_USD
        );
      })
      .map((pool): Pool => ({
        id: pool.pool,
        name: `${pool.project} ${pool.symbol}`,
        protocol: pool.project,
        apr: Number(pool.apy.toFixed(2)),
        aprChange24h: pool.apyPct1D ?? null,
        tvlUsd: pool.tvlUsd ?? 0,
        risk: this.mapRisk(pool.ilRisk),
        minDepositUsd: null,
        assetPair: pool.symbol
      }))
      .sort((a, b) => b.apr - a.apr)
      .slice(0, PoolService.MAX_POOLS);
  }

  async getTopPools(): Promise<Pool[]> {
    try {
      return await this.fetchStarknetPools();
    } catch (error) {
      logger.error({ error }, "Failed to fetch live Starknet pools");
      return [];
    }
  }

  async getPoolById(poolId: string): Promise<Pool | null> {
    const pools = await this.getTopPools();
    return pools.find((pool) => pool.id === poolId) ?? null;
  }

  async getBestPool(): Promise<Pool> {
    const pools = await this.getTopPools();
    if (pools.length === 0) {
      throw new Error("No Starknet pools available");
    }
    return pools[0];
  }
}
