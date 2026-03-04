import type { Pool } from "@starkyield/shared";
import { api } from "./api";

export async function fetchPools(): Promise<Pool[]> {
  const { data } = await api.get<Pool[]>("/api/pools");
  return [...data].sort((a, b) => b.apr - a.apr);
}

export async function fetchPoolById(id: string): Promise<Pool> {
  const { data } = await api.get<Pool>(`/api/pools/${id}`);
  return data;
}
