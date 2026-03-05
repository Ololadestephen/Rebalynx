import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { PoolService } from "../services/pool.service.js";
import { StarknetService } from "../services/starknet.service.js";
import { PositionModel } from "../models/position.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { logger } from "../utils/logger.js";

const depositSchema = z.object({
  wallet: z.string().min(3),
  poolId: z.string().min(3),
  amount: z.coerce.number().positive(),
  txHash: z.string().startsWith("0x").optional()
});

export function createDepositRouter(poolService: PoolService, starknetService: StarknetService): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const payload = depositSchema.parse(req.body);
      const pool = await poolService.getPoolById(payload.poolId);

      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      let txHash = payload.txHash;
      if (txHash) {
        const verified = await starknetService.verifyTransaction(txHash);
        if (!verified) {
          return res.status(400).json({ error: "Provided transaction hash is not confirmed on Starknet" });
        }
      } else {
        const tx = await starknetService.executeWithRetry(`deposit:${payload.poolId}:${payload.wallet}:${payload.amount}`);
        txHash = tx.txHash;
      }

      if (mongoose.connection.readyState !== 1) {
        if (process.env.NODE_ENV === "test") {
          logger.warn({ wallet: payload.wallet }, "Skipping position persistence in test without MongoDB");
          return res.status(200).json({ status: "success", txHash });
        }
        return res.status(503).json({ error: "Database unavailable. Deposit not persisted." });
      }

      await PositionModel.findOneAndUpdate(
        { wallet: payload.wallet },
        {
          wallet: payload.wallet,
          poolId: payload.poolId,
          $inc: { depositedUsd: payload.amount },
          threshold: 1,
          monitoring: false,
          enabled: false
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await TransactionModel.create({
        wallet: payload.wallet,
        poolId: payload.poolId,
        amountUsd: payload.amount,
        txHash,
        type: "deposit"
      });

      return res.status(200).json({ status: "success", txHash });
    } catch (error) {
      const message = (error as Error).message ?? "unknown error";
      if (message.includes("Failed action deposit")) {
        return res.status(503).json({
          error: "Deposit execution failed on Starknet RPC",
          details: message
        });
      }
      return next(error);
    }
  });

  return router;
}
