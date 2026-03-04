import axios from "axios";
import { api } from "./api";

export interface WithdrawPayload {
  wallet: string;
  poolId: string;
  amount: string;
  txHash?: string;
}

export async function withdrawFromPool(payload: WithdrawPayload): Promise<{ txHash: string }> {
  try {
    const { data } = await api.post<{ txHash: string }>("/api/withdraw", payload);
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
