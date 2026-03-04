import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PoolCard } from "@/components/pool-card";

const pool = {
  id: "starkswap_eth_usdc",
  name: "StarkSwap ETH/USDC",
  protocol: "StarkSwap",
  apr: 14.2,
  aprChange24h: 0.9,
  tvlUsd: 3_400_000,
  risk: "Medium" as const,
  minDepositUsd: 10,
  assetPair: "ETH/USDC"
};

describe("PoolCard", () => {
  it("renders pool info", () => {
    render(<PoolCard pool={pool} onDeposit={vi.fn()} />);

    expect(screen.getByText("StarkSwap ETH/USDC")).toBeInTheDocument();
    expect(screen.getByText(/14.20%/)).toBeInTheDocument();
    expect(screen.getByText(/\$10/)).toBeInTheDocument();
  });
});
