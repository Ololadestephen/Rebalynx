import type { PortfolioResponse } from "@starkyield/shared";
import { PositionModel } from "../models/position.model.js";
import { PoolService } from "./pool.service.js";

export class PortfolioService {
  constructor(private readonly poolService = new PoolService()) {}

  async getWalletPortfolio(wallet: string): Promise<PortfolioResponse> {
    const position = await PositionModel.findOne({ wallet }).lean();

    if (!position) {
      return {
        wallet,
        totalValueUsd: 0,
        depositedUsd: 0,
        currentPool: null,
        monitoringEnabled: false
      };
    }

    const pool = await this.poolService.getPoolById(position.poolId);

    return {
      wallet,
      totalValueUsd: Number((position.depositedUsd ?? 0).toFixed(2)),
      depositedUsd: Number((position.depositedUsd ?? 0).toFixed(2)),
      currentPool: pool,
      monitoringEnabled: Boolean(position.monitoring && position.enabled)
    };
  }
}
