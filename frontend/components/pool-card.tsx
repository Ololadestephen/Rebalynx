"use client";

import React from "react";
import Link from "next/link";
import type { Pool } from "@starkyield/shared";

interface PoolCardProps {
  pool: Pool;
  onDeposit: (pool: Pool) => void;
}

export function PoolCard({ pool, onDeposit }: PoolCardProps) {
  const riskClass = pool.risk === "Low" ? "text-success" : pool.risk === "Medium" ? "text-yellow-300" : "text-danger";
  const aprChange = typeof pool.aprChange24h === "number" ? pool.aprChange24h : null;
  const hasAprChange = aprChange !== null;
  const aprDirectionClass = hasAprChange && aprChange >= 0 ? "text-success" : "text-danger";
  const aprDirection = hasAprChange && aprChange >= 0 ? "▲" : "▼";

  return (
    <div className="rounded-2xl border border-slate-700 bg-panel p-5">
      <h3 className="text-lg font-semibold">{pool.name}</h3>
      <p className="mt-1 text-sm text-slate-300">Protocol: {pool.protocol}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p>APR: <span className="text-accent">{pool.apr.toFixed(2)}%</span></p>
        <p className={hasAprChange ? aprDirectionClass : "text-slate-300"}>
          24h: {hasAprChange ? `${aprDirection} ${Math.abs(aprChange).toFixed(2)}%` : "N/A"}
        </p>
        <p>TVL: ${(pool.tvlUsd / 1_000_000).toFixed(2)}M</p>
        <p>
          Risk: <span className={riskClass}>{pool.risk}</span>
        </p>
        <p>Min Deposit: {pool.minDepositUsd === null ? "N/A" : `$${pool.minDepositUsd}`}</p>
      </div>
      <div className="mt-5 flex gap-3">
        <button className="rounded-lg bg-accent px-4 py-2 font-medium text-slate-900" onClick={() => onDeposit(pool)}>
          Deposit
        </button>
        <Link className="rounded-lg border border-slate-600 px-4 py-2 text-sm" href={`/pools/${encodeURIComponent(pool.id)}`}>
          View Details
        </Link>
      </div>
    </div>
  );
}
