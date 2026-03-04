import type { RebalanceActivityRecord } from "@starkyield/shared";
import { RebalanceActivityModel } from "../models/rebalance-activity.model.js";

export class RebalanceActivityService {
  async listByWallet(wallet: string): Promise<RebalanceActivityRecord[]> {
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
