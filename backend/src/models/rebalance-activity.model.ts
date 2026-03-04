import mongoose, { Schema } from "mongoose";

export interface RebalanceActivityDocument {
  wallet: string;
  fromPool: string;
  toPool: string;
  aprDelta: number;
  threshold: number;
  triggered: boolean;
  reason: string;
  txHashExit?: string;
  txHashEnter?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rebalanceActivitySchema = new Schema<RebalanceActivityDocument>(
  {
    wallet: { type: String, required: true, index: true },
    fromPool: { type: String, required: true },
    toPool: { type: String, required: true },
    aprDelta: { type: Number, required: true },
    threshold: { type: Number, required: true },
    triggered: { type: Boolean, required: true },
    reason: { type: String, required: true },
    txHashExit: { type: String },
    txHashEnter: { type: String }
  },
  { timestamps: true }
);

rebalanceActivitySchema.index({ wallet: 1, createdAt: -1 });

export const RebalanceActivityModel = mongoose.model<RebalanceActivityDocument>(
  "RebalanceActivity",
  rebalanceActivitySchema
);
