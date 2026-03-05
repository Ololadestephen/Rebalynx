import { Router } from "express";
import { z } from "zod";
import { RebalanceService } from "../services/rebalance.service.js";
import { SignatureService } from "../services/signature.service.js";

const enableSchema = z.object({
  wallet: z.string().min(3),
  poolId: z.string().min(3),
  threshold: z.number().min(0.1).max(20),
  signature: z.array(z.string()).min(2),
  message: z.string().min(1)
});

const disableSchema = z.object({
  wallet: z.string().min(3),
  signature: z.array(z.string()).min(2),
  message: z.string().min(1)
});

export function createRebalanceRouter(rebalanceService: RebalanceService, signatureService: SignatureService): Router {
  const router = Router();

  router.post("/enable", async (req, res, next) => {
    try {
      const payload = enableSchema.parse(req.body);

      const verified = signatureService.verifySignature(payload.wallet, payload.signature, payload.message);
      if (!verified) {
        return res.status(401).json({ error: "Invalid wallet signature" });
      }

      await rebalanceService.enable(payload.wallet, payload.poolId, payload.threshold);
      return res.status(200).json({ ok: true });
    } catch (error) {
      const message = (error as Error).message ?? "";
      if (message.includes("Database unavailable")) {
        return res.status(503).json({ error: "Database unavailable. Check MONGODB_URI and redeploy backend." });
      }
      return next(error);
    }
  });

  router.post("/disable", async (req, res, next) => {
    try {
      const payload = disableSchema.parse(req.body);

      const verified = signatureService.verifySignature(payload.wallet, payload.signature, payload.message);
      if (!verified) {
        return res.status(401).json({ error: "Invalid wallet signature" });
      }

      await rebalanceService.disable(payload.wallet);
      return res.status(200).json({ ok: true });
    } catch (error) {
      const message = (error as Error).message ?? "";
      if (message.includes("Database unavailable")) {
        return res.status(503).json({ error: "Database unavailable. Check MONGODB_URI and redeploy backend." });
      }
      return next(error);
    }
  });

  router.get("/status/:wallet", async (req, res, next) => {
    try {
      const wallet = z.string().min(3).parse(req.params.wallet);
      const status = await rebalanceService.status(wallet);
      return res.status(200).json(status);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
