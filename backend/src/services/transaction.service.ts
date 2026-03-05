import type { TransactionRecord } from "@starkyield/shared";
import mongoose from "mongoose";
import { TransactionModel } from "../models/transaction.model.js";
import { logger } from "../utils/logger.js";

export class TransactionService {
  async listByWallet(wallet: string): Promise<TransactionRecord[]> {
    if (mongoose.connection.readyState !== 1) {
      logger.warn({ wallet }, "Transactions requested while MongoDB is disconnected");
      return [];
    }

    const transactions = await TransactionModel.find({ wallet }).sort({ createdAt: -1 }).limit(100).lean();
    return transactions.map((item) => ({
      wallet: item.wallet,
      poolId: item.poolId,
      amountUsd: item.amountUsd,
      txHash: item.txHash,
      type: item.type,
      createdAt: item.createdAt.toISOString()
    }));
  }
}
