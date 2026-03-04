import type { PositionSummary } from "@starkyield/shared";
import { api } from "./api";

export async function fetchPositions(wallet: string): Promise<PositionSummary[]> {
  const { data } = await api.get<PositionSummary[]>(`/api/positions/${wallet}`);
  return data;
}
