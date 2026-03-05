import type { RebalanceActivityRecord } from "@starkyield/shared";
import mongoose from "mongoose";
import { RebalanceActivityModel } from "../models/rebalance-activity.model.js";
import { logger } from "../utils/logger.js";

export class RebalanceActivityService {
  async listByWallet(wallet: string): Promise<RebalanceActivityRecord[]> {
    if (mongoose.connection.readyState !== 1) {
      logger.warn({ wallet }, "Rebalance activity requested while MongoDB is disconnected");
      return [];
    }

    const events = await RebalanceActivityModel.find({ wallet }).sort({ createdAt: -1 }).limit(100).lean();
    return events.map((item) => ({
      wallet: item.wallet,
      fromPool: item.fromPool,
      toPool: item.toPool,
      aprDelta: item.aprDelta,
      threshold: item.threshold,
      triggered: item.triggered,
      reason: item.reason,
      txHashExit: item.txHashExit,
      txHashEnter: item.txHashEnter,
      createdAt: item.createdAt.toISOString()
    }));
  }
}
