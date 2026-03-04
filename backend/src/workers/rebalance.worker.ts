import cron from "node-cron";
import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { RebalanceService } from "../services/rebalance.service.js";
import { logger } from "../utils/logger.js";

async function startWorker() {
  await connectDb();
  const rebalanceService = new RebalanceService();

  cron.schedule(env.REBALANCE_CRON, async () => {
    logger.info("Running rebalance tick");
    await rebalanceService.runMonitorTick();
  });

  logger.info({ schedule: env.REBALANCE_CRON }, "Rebalance worker started");
}

startWorker().catch((error) => {
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});
