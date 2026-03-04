import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  try {
    await connectDb();
    logger.info("MongoDB connected");
  } catch (error) {
    logger.warn({ error }, "MongoDB unavailable. Starting API without DB-backed features.");
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Backend API running");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
