"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTokenBalances } from "@/services/balances";

export function useBalances(wallet: string) {
  return useQuery({
    queryKey: ["balances", wallet],
    queryFn: () => fetchTokenBalances(wallet),
    enabled: Boolean(wallet),
    refetchInterval: 30_000
  });
}
