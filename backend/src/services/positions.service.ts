import type { PositionSummary } from "@starkyield/shared";
import { TransactionModel } from "../models/transaction.model.js";

export class PositionsService {
  async listWalletPositions(wallet: string): Promise<PositionSummary[]> {
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
