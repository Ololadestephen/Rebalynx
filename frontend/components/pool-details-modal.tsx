"use client";

import type { Pool } from "@starkyield/shared";

interface PoolDetailsModalProps {
  pool: Pool | null;
  onClose: () => void;
}

function defillamaPoolUrl(poolId: string): string {
  return `https://defillama.com/yields/pool/${poolId}`;
}

export function PoolDetailsModal({ pool, onClose }: PoolDetailsModalProps) {
  if (!pool) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-panel p-6">
        <h3 className="text-xl font-semibold">{pool.name}</h3>
        <div className="mt-4 grid gap-2 text-sm text-slate-200">
          <p>Protocol: {pool.protocol}</p>
          <p>Asset Pair: {pool.assetPair}</p>
          <p>APR: {pool.apr.toFixed(2)}%</p>
          <p>APR 24h: {pool.aprChange24h === null ? "N/A" : `${pool.aprChange24h.toFixed(2)}%`}</p>
          <p>TVL: ${pool.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p>Risk Score: {pool.risk}</p>
          <p>Minimum Deposit: {pool.minDepositUsd === null ? "N/A" : `$${pool.minDepositUsd}`}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={defillamaPoolUrl(pool.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-slate-900"
          >
            Open Pool Source
          </a>
          <button className="rounded-lg border border-slate-600 px-4 py-2" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
