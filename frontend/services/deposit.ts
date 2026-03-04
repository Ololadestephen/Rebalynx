import { api } from "./api";
import axios from "axios";

export interface DepositPayload {
  wallet: string;
  poolId: string;
  amount: string;
  txHash?: string;
}

export async function depositToPool(payload: DepositPayload): Promise<{ txHash: string }> {
  try {
    const { data } = await api.post<{ txHash: string }>("/api/deposit", payload);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const details = (error.response?.data as { details?: string; error?: string } | undefined)?.details;
      const apiError = (error.response?.data as { details?: string; error?: string } | undefined)?.error;
      throw new Error(details ?? apiError ?? error.message);
    }
    throw error;
  }
}
