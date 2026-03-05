import { Router } from "express";
import { z } from "zod";
import { PortfolioService } from "../services/portfolio.service.js";
import { normalizeWalletAddress } from "../utils/wallet.js";

export function createPortfolioRouter(portfolioService: PortfolioService): Router {
  const router = Router();

  router.get("/:wallet", async (req, res, next) => {
    try {
      const wallet = normalizeWalletAddress(z.string().min(3).parse(req.params.wallet));
      const data = await portfolioService.getWalletPortfolio(wallet);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
