import type { PositionSummary } from "@starkyield/shared";
import mongoose from "mongoose";
import { TransactionModel } from "../models/transaction.model.js";
import { logger } from "../utils/logger.js";

export class PositionsService {
  async listWalletPositions(wallet: string): Promise<PositionSummary[]> {
    if (mongoose.connection.readyState !== 1) {
      logger.warn({ wallet }, "Positions requested while MongoDB is disconnected");
      return [];
    }

    const rows = await TransactionModel.aggregate<{
      wallet: string;
      poolId: string;
      amountUsd: number;
      lastUpdated: Date;
    }>([
      { $match: { wallet, type: { $in: ["deposit", "withdraw"] } } },
      {
        $addFields: {
          signedAmountUsd: {
            $cond: [{ $eq: ["$type", "withdraw"] }, { $multiply: ["$amountUsd", -1] }, "$amountUsd"]
          }
        }
      },
      {
        $group: {
          _id: "$poolId",
          wallet: { $first: "$wallet" },
          amountUsd: { $sum: "$signedAmountUsd" },
          lastUpdated: { $max: "$createdAt" }
        }
      },
      { $match: { amountUsd: { $gt: 0 } } },
      { $project: { _id: 0, poolId: "$_id", wallet: 1, amountUsd: 1, lastUpdated: 1 } },
      { $sort: { amountUsd: -1 } }
    ]);

    return rows.map((row) => ({
      wallet: row.wallet,
      poolId: row.poolId,
      amountUsd: row.amountUsd,
      lastUpdated: row.lastUpdated.toISOString()
    }));
  }
}
