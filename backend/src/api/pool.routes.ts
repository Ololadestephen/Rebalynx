import { Router } from "express";
import { z } from "zod";
import { PoolService } from "../services/pool.service.js";

export function createPoolRouter(poolService: PoolService): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const pools = await poolService.getTopPools();
      return res.status(200).json(pools);
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const id = z.string().min(2).parse(req.params.id);
      const pool = await poolService.getPoolById(id);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      return res.status(200).json(pool);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
