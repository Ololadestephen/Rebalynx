import type { RebalanceActivityRecord } from "@starkyield/shared";
import { api } from "./api";

export async function fetchRebalanceActivity(wallet: string): Promise<RebalanceActivityRecord[]> {
  const { data } = await api.get<RebalanceActivityRecord[]>(`/api/rebalance/activity/${wallet}`);
  return data;
}
