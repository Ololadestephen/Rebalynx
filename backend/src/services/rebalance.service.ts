import type { RebalanceStatusResponse } from "@starkyield/shared";
import { PositionModel } from "../models/position.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { RebalanceActivityModel } from "../models/rebalance-activity.model.js";
import { PoolService } from "./pool.service.js";
import { StarknetService } from "./starknet.service.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

export class RebalanceService {
  constructor(
    private readonly poolService = new PoolService(),
    private readonly starknetService = new StarknetService()
  ) {}

  async enable(wallet: string, poolId: string, threshold: number): Promise<void> {
    const current = await PositionModel.findOne({ wallet }).lean();
    await PositionModel.findOneAndUpdate(
      { wallet },
      {
        wallet,
        poolId,
        depositedUsd: current?.depositedUsd ?? 0,
        threshold,
        monitoring: true,
        enabled: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async disable(wallet: string): Promise<void> {
    await PositionModel.findOneAndUpdate(
      { wallet },
      {
        enabled: false,
        monitoring: false
      }
    );
  }

  async status(wallet: string): Promise<RebalanceStatusResponse> {
    if (mongoose.connection.readyState !== 1) {
      logger.warn({ wallet }, "Rebalance status requested while MongoDB is disconnected");
      return {
        enabled: false,
        monitoring: false,
        pool: null,
        threshold: 0
      };
    }

    const position = await PositionModel.findOne({ wallet }).lean();

    return {
      enabled: Boolean(position?.enabled),
      monitoring: Boolean(position?.monitoring),
      pool: position?.poolId ?? null,
      threshold: position?.threshold ?? 0,
      lastRebalance: position?.lastRebalance?.toISOString()
    };
  }

  async runMonitorTick(): Promise<void> {
    const positions = await PositionModel.find({ monitoring: true, enabled: true }).lean();

    for (const position of positions) {
      try {
        const currentPool = await this.poolService.getPoolById(position.poolId);
        const bestPool = await this.poolService.getBestPool();

        if (!currentPool) {
          logger.warn({ wallet: position.wallet, poolId: position.poolId }, "Current pool not found");
          continue;
        }

        const aprDelta = bestPool.apr - currentPool.apr;
        if (aprDelta <= position.threshold) {
          if (mongoose.connection.readyState === 1) {
            await RebalanceActivityModel.create({
              wallet: position.wallet,
              fromPool: position.poolId,
              toPool: bestPool.id,
              aprDelta,
              threshold: position.threshold,
              triggered: false,
              reason: "APR delta below threshold"
            });
          }
          continue;
        }

        const exitTx = await this.starknetService.executeWithRetry(`exit:${position.poolId}:${position.wallet}`);
        const enterTx = await this.starknetService.executeWithRetry(`enter:${bestPool.id}:${position.wallet}`);

        await PositionModel.findOneAndUpdate(
          { wallet: position.wallet },
          {
            poolId: bestPool.id,
            lastRebalance: new Date()
          }
        );

        if (mongoose.connection.readyState === 1) {
          await RebalanceActivityModel.create({
            wallet: position.wallet,
            fromPool: position.poolId,
            toPool: bestPool.id,
            aprDelta,
            threshold: position.threshold,
            triggered: true,
            reason: "APR delta exceeded threshold",
            txHashExit: exitTx.txHash,
            txHashEnter: enterTx.txHash
          });

          await TransactionModel.create([
            {
              wallet: position.wallet,
              poolId: position.poolId,
              amountUsd: 0,
              txHash: exitTx.txHash,
              type: "rebalance_exit"
            },
            {
              wallet: position.wallet,
              poolId: bestPool.id,
              amountUsd: 0,
              txHash: enterTx.txHash,
              type: "rebalance_enter"
            }
          ]);
        }

        logger.info(
          {
            wallet: position.wallet,
            fromPool: position.poolId,
            toPool: bestPool.id,
            aprDelta
          },
          "Rebalance executed"
        );
      } catch (error) {
        logger.error({ wallet: position.wallet, error }, "Rebalance failed");
      }
    }
  }
}
