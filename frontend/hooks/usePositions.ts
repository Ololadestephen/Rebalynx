"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/services/positions";

export function usePositions(wallet: string) {
  return useQuery({
    queryKey: ["positions", wallet],
    queryFn: () => fetchPositions(wallet),
    enabled: Boolean(wallet),
    refetchInterval: 15_000
  });
}
