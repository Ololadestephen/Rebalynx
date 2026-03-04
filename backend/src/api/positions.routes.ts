import { Router } from "express";
import { z } from "zod";
import { PositionsService } from "../services/positions.service.js";

export function createPositionsRouter(service: PositionsService): Router {
  const router = Router();

  router.get("/:wallet", async (req, res, next) => {
    try {
      const wallet = z.string().min(3).parse(req.params.wallet);
      const data = await service.listWalletPositions(wallet);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
