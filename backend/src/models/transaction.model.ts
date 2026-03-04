import mongoose, { Schema } from "mongoose";

export interface TransactionDocument {
  wallet: string;
  poolId: string;
  amountUsd: number;
  txHash: string;
  type: "deposit" | "withdraw" | "rebalance_exit" | "rebalance_enter";
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    wallet: { type: String, required: true, index: true },
    poolId: { type: String, required: true },
    amountUsd: { type: Number, required: true, min: 0 },
    txHash: { type: String, required: true },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "rebalance_exit", "rebalance_enter"],
      required: true
    }
  },
  { timestamps: true }
);

transactionSchema.index({ wallet: 1, createdAt: -1 });

export const TransactionModel = mongoose.model<TransactionDocument>("Transaction", transactionSchema);
