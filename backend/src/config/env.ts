import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/rebalynx"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
  STARKNET_RPC_URL: z.string().default("https://free-rpc.nethermind.io/sepolia-juno/v0_7"),
  REBALANCE_CRON: z.string().default("*/30 * * * *"),
  TX_MAX_RETRIES: z.coerce.number().default(3),
  TX_SIMULATION_FALLBACK: z.coerce.boolean().default(false)
});

export const env = envSchema.parse(process.env);
