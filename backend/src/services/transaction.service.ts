import type { TransactionRecord } from "@starkyield/shared";
import { TransactionModel } from "../models/transaction.model.js";

export class TransactionService {
  async listByWallet(wallet: string): Promise<TransactionRecord[]> {
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
