import type { TransactionRecord } from "@starkyield/shared";
import { api } from "./api";

export async function fetchTransactions(wallet: string): Promise<TransactionRecord[]> {
  const { data } = await api.get<TransactionRecord[]>(`/api/transactions/${wallet}`);
  return data;
}
