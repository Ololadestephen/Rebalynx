import { Router } from "express";
import { z } from "zod";
import { TransactionService } from "../services/transaction.service.js";

export function createTransactionRouter(transactionService: TransactionService): Router {
  const router = Router();

  router.get("/:wallet", async (req, res, next) => {
    try {
      const wallet = z.string().min(3).parse(req.params.wallet);
      const data = await transactionService.listByWallet(wallet);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
