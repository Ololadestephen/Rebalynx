import type { PortfolioResponse } from "@starkyield/shared";
import { api } from "./api";

export async function fetchPortfolio(wallet: string): Promise<PortfolioResponse> {
  const { data } = await api.get<PortfolioResponse>(`/api/portfolio/${wallet}`);
  return data;
}
