import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 4000
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
