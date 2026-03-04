"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPools } from "@/services/pools";

export function usePools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: fetchPools,
    refetchInterval: 30 * 60 * 1000
  });
}
