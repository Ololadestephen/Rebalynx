import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app.js";
import { connectDb } from "../src/config/db.js";

const app = createApp();
let dbInit: Promise<void> | null = null;

async function ensureDbConnection(): Promise<void> {
  if (!dbInit) {
    dbInit = connectDb().catch((error) => {
      dbInit = null;
      throw error;
    });
  }
  await dbInit;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureDbConnection();
  } catch {
    // Keep API alive even when MongoDB is temporarily unavailable.
    // Routes that require DB already handle this gracefully.
  }

  return app(req, res);
}
