import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { createRebalanceRouter } from "./api/rebalance.routes.js";
import { createPoolRouter } from "./api/pool.routes.js";
import { createDepositRouter } from "./api/deposit.routes.js";
import { createWithdrawRouter } from "./api/withdraw.routes.js";
import { createPortfolioRouter } from "./api/portfolio.routes.js";
import { createTransactionRouter } from "./api/transaction.routes.js";
import { createRebalanceActivityRouter } from "./api/rebalance-activity.routes.js";
import { createPositionsRouter } from "./api/positions.routes.js";
import { RebalanceService } from "./services/rebalance.service.js";
import { SignatureService } from "./services/signature.service.js";
import { PoolService } from "./services/pool.service.js";
import { StarknetService } from "./services/starknet.service.js";
import { PortfolioService } from "./services/portfolio.service.js";
import { TransactionService } from "./services/transaction.service.js";
import { RebalanceActivityService } from "./services/rebalance-activity.service.js";
import { PositionsService } from "./services/positions.service.js";
import { apiRateLimit } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";

interface AppDeps {
  rebalanceService?: RebalanceService;
  signatureService?: SignatureService;
  poolService?: PoolService;
  starknetService?: StarknetService;
  portfolioService?: PortfolioService;
  transactionService?: TransactionService;
  rebalanceActivityService?: RebalanceActivityService;
  positionsService?: PositionsService;
}

export function createApp(deps: AppDeps = {}) {
  const app = express();
  const rebalanceService = deps.rebalanceService ?? new RebalanceService();
  const signatureService = deps.signatureService ?? new SignatureService();
  const poolService = deps.poolService ?? new PoolService();
  const starknetService = deps.starknetService ?? new StarknetService();
  const portfolioService = deps.portfolioService ?? new PortfolioService(poolService);
  const transactionService = deps.transactionService ?? new TransactionService();
  const rebalanceActivityService = deps.rebalanceActivityService ?? new RebalanceActivityService();
  const positionsService = deps.positionsService ?? new PositionsService();

  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json());
  app.use(apiRateLimit);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/pools", createPoolRouter(poolService));
  app.use("/api/portfolio", createPortfolioRouter(portfolioService));
  app.use("/api/transactions", createTransactionRouter(transactionService));
  app.use("/api/rebalance/activity", createRebalanceActivityRouter(rebalanceActivityService));
  app.use("/api/positions", createPositionsRouter(positionsService));
  app.use("/api/deposit", createDepositRouter(poolService, starknetService));
  app.use("/api/withdraw", createWithdrawRouter(poolService, starknetService));
  app.use("/api/rebalance", createRebalanceRouter(rebalanceService, signatureService));

  app.use(errorHandler);

  return app;
}
