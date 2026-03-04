import { Router } from "express";
import { z } from "zod";
import { RebalanceActivityService } from "../services/rebalance-activity.service.js";

export function createRebalanceActivityRouter(service: RebalanceActivityService): Router {
  const router = Router();

  router.get("/:wallet", async (req, res, next) => {
    try {
      const wallet = z.string().min(3).parse(req.params.wallet);
      const data = await service.listByWallet(wallet);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
