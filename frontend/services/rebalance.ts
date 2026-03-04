import type { RebalanceStatusResponse } from "@starkyield/shared";
import { api } from "./api";

interface RebalancePayload {
  wallet: string;
  poolId: string;
  threshold: number;
  signature: string[];
  message: string;
}

export async function enableRebalance(payload: RebalancePayload): Promise<void> {
  await api.post("/api/rebalance/enable", payload);
}

export async function disableRebalance(wallet: string, signature: string[], message: string): Promise<void> {
  await api.post("/api/rebalance/disable", { wallet, signature, message });
}

export async function fetchRebalanceStatus(wallet: string): Promise<RebalanceStatusResponse> {
  const { data } = await api.get<RebalanceStatusResponse>(`/api/rebalance/status/${wallet}`);
  return data;
}
