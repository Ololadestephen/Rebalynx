import mongoose, { Schema } from "mongoose";

export interface PositionDocument {
  wallet: string;
  poolId: string;
  depositedUsd: number;
  threshold: number;
  monitoring: boolean;
  enabled: boolean;
  lastRebalance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const positionSchema = new Schema<PositionDocument>(
  {
    wallet: { type: String, required: true },
    poolId: { type: String, required: true },
    depositedUsd: { type: Number, default: 0, min: 0 },
    threshold: { type: Number, required: true, min: 0.1, max: 20 },
    monitoring: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    lastRebalance: { type: Date }
  },
  { timestamps: true }
);

positionSchema.index({ wallet: 1 }, { unique: true });

export const PositionModel = mongoose.model<PositionDocument>("Position", positionSchema);
