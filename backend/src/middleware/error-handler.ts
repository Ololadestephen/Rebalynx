import { type NextFunction, type Request, type Response } from "express";

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  res.status(500).json({ error: "Internal server error", details: error.message });
}
