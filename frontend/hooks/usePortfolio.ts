"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPortfolio } from "@/services/portfolio";

export function usePortfolio(wallet: string) {
  return useQuery({
    queryKey: ["portfolio", wallet],
    queryFn: () => fetchPortfolio(wallet),
    enabled: Boolean(wallet),
    refetchInterval: 60_000
  });
}
