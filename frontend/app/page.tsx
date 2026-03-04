"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { RebalancePanel } from "@/components/rebalance-panel";
import { useWallet } from "@/hooks/use-wallet";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useBalances } from "@/hooks/useBalances";
import { usePools } from "@/hooks/usePools";
import { usePositions } from "@/hooks/usePositions";
import { fetchTransactions } from "@/services/transactions";
import { fetchRebalanceActivity } from "@/services/rebalance-activity";
import { fetchPoolById } from "@/services/pools";
import { getTxExplorerUrl } from "@/utils/explorer";
import type { Pool } from "@starkyield/shared";

type ActivityItem =
  | {
    id: string;
    timestamp: number;
    createdAt: string;
    kind: "transaction";
    title: string;
    poolLabel: string;
    amountUsd: number;
    txHash: string;
  }
  | {
    id: string;
    timestamp: number;
    createdAt: string;
    kind: "rebalance";
    title: string;
    fromPool: string;
    toPool: string;
    aprDelta: number;
    threshold: number;
    reason: string;
    txHashExit?: string;
    txHashEnter?: string;
  };

function formatTxType(type: string): string {
  if (type === "rebalance_exit") return "Rebalance Exit";
  if (type === "rebalance_enter") return "Rebalance Enter";
  if (type === "withdraw") return "Withdraw";
  return "Deposit";
}

export default function AppPage() {
  const { wallet } = useWallet();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedWithdrawPool, setSelectedWithdrawPool] = useState<Pool | null>(null);
  const [selectedWithdrawMaxAmount, setSelectedWithdrawMaxAmount] = useState(0);
  const [rebalanceTargetPoolId, setRebalanceTargetPoolId] = useState("");

  const { data: portfolio } = usePortfolio(wallet);
  const { data: balances } = useBalances(wallet);
  const { data: pools, isLoading: poolsLoading, isError: poolsError } = usePools();
  const { data: positions, isLoading: positionsLoading } = usePositions(wallet);

  const transactionsQuery = useQuery({
    queryKey: ["transactions", wallet],
    queryFn: () => fetchTransactions(wallet),
    enabled: Boolean(wallet),
    refetchInterval: 15000
  });

  const rebalanceQuery = useQuery({
    queryKey: ["rebalance-activity", wallet],
    queryFn: () => fetchRebalanceActivity(wallet),
    enabled: Boolean(wallet),
    refetchInterval: 15000
  });

  const currentPool = portfolio?.currentPool ?? null;
  const defaultRebalancePoolId = currentPool?.id ?? "";
  const portfolioValue = `$${(portfolio?.totalValueUsd ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}`;

  const visiblePools = useMemo(() => (pools ?? []).slice(0, 50), [pools]);

  const activity = useMemo<ActivityItem[]>(() => {
    const txItems: ActivityItem[] = (transactionsQuery.data ?? []).map((tx) => ({
      id: `tx-${tx.txHash}-${tx.createdAt}`,
      timestamp: new Date(tx.createdAt).getTime(),
      createdAt: tx.createdAt,
      kind: "transaction",
      title: formatTxType(tx.type),
      poolLabel: tx.poolId,
      amountUsd: tx.amountUsd,
      txHash: tx.txHash
    }));

    const rebalanceItems: ActivityItem[] = (rebalanceQuery.data ?? []).map((event, index) => ({
      id: `rb-${event.createdAt}-${index}`,
      timestamp: new Date(event.createdAt).getTime(),
      createdAt: event.createdAt,
      kind: "rebalance",
      title: event.triggered ? "Rebalance Triggered" : "Rebalance Skipped",
      fromPool: event.fromPool,
      toPool: event.toPool,
      aprDelta: event.aprDelta,
      threshold: event.threshold,
      reason: event.reason,
      txHashExit: event.txHashExit,
      txHashEnter: event.txHashEnter
    }));

    return [...txItems, ...rebalanceItems].sort((a, b) => b.timestamp - a.timestamp);
  }, [transactionsQuery.data, rebalanceQuery.data]);

  const activityLoading = transactionsQuery.isLoading || rebalanceQuery.isLoading;
  const activityError = transactionsQuery.isError || rebalanceQuery.isError;

  useEffect(() => {
    if (!rebalanceTargetPoolId && defaultRebalancePoolId) {
      setRebalanceTargetPoolId(defaultRebalancePoolId);
    }
  }, [rebalanceTargetPoolId, defaultRebalancePoolId]);

  const onManagePositionDeposit = async (poolId: string) => {
    const poolMatch = (pools ?? []).find((pool) => pool.id === poolId);
    if (poolMatch) {
      setSelectedPool(poolMatch);
      return;
    }

    try {
      const pool = await fetchPoolById(poolId);
      setSelectedPool(pool);
    } catch {
      toast.error("Pool details are unavailable right now. Reload pools and try again.");
    }
  };

  const onManagePositionWithdraw = async (poolId: string, maxAmountUsd: number) => {
    const poolMatch = (pools ?? []).find((pool) => pool.id === poolId);
    if (poolMatch) {
      setSelectedWithdrawPool(poolMatch);
      setSelectedWithdrawMaxAmount(maxAmountUsd);
      return;
    }

    try {
      const pool = await fetchPoolById(poolId);
      setSelectedWithdrawPool(pool);
      setSelectedWithdrawMaxAmount(maxAmountUsd);
    } catch {
      toast.error("Pool details are unavailable right now. Reload pools and try again.");
    }
  };

  const onManageRebalanceTarget = (poolId: string) => {
    setRebalanceTargetPoolId(poolId);
    document.getElementById("rebalance")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-6 py-12">
      <section id="overview" className="relative overflow-hidden rounded-3xl glass-panel p-8 md:p-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Yield Optimizer <br />
            <span className="text-accent">on Starknet</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed font-light">
            Autonomous yield aggregation and automation. Scan top pools, compare real-time APRs, and let the agent rebalance for maximum returns.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <article className="glass-card p-6 rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Connected Wallet</p>
            <p className="text-sm font-medium text-slate-200 break-all leading-relaxed font-mono">
              {wallet ? `${wallet}` : "Not connected"}
            </p>
          </article>
          <article className="glass-card p-6 rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Portfolio Value</p>
            <p className="text-2xl font-bold text-white mb-3">{portfolioValue}</p>
            <div className="flex gap-4">
              <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-500">STRK</p>
                <p className="text-xs font-medium text-emerald-400">{balances ? balances.strk.toFixed(4) : "-"}</p>
              </div>
              <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-500">USDC</p>
                <p className="text-xs font-medium text-accent">{balances ? balances.usdc.toFixed(2) : "-"}</p>
              </div>
            </div>
          </article>
          <article className="glass-card p-6 rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Current Strategy</p>
            <p className="text-xl font-bold text-white">{currentPool?.name ?? "No active position"}</p>
            {currentPool && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400">APR {currentPool.apr.toFixed(2)}%</span>
              </div>
            )}
          </article>
        </div>

        {/* Abstract background element */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      </section>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <section id="rebalance" className="lg:col-span-4 rounded-3xl glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Auto Rebalance</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Configure your rebalancing threshold to let the agent automatically move your funds when higher yield opportunities arise.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Target Pool</p>
            <p className="text-sm font-semibold text-accent">{(rebalanceTargetPoolId || defaultRebalancePoolId) || "Not Set"}</p>
          </div>
          {wallet && (rebalanceTargetPoolId || defaultRebalancePoolId) ? (
            <RebalancePanel wallet={wallet} defaultPoolId={rebalanceTargetPoolId || defaultRebalancePoolId} />
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center">
              <p className="text-xs text-slate-500">Connect wallet to enable rebalancing</p>
            </div>
          )}
        </section>

        <section id="positions" className="lg:col-span-8 rounded-3xl glass-panel p-8">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Active Positions</h2>
          {!wallet && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-500">Connect wallet to view your active yield positions.</p>
            </div>
          )}
          {wallet && positionsLoading && <LoadingSkeleton />}
          {wallet && !positionsLoading && (positions?.length ?? 0) === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-500 font-light">No positions active. Explore the pool explorer below to start earning.</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {positions?.map((position) => (
              <article key={`${position.poolId}-${position.lastUpdated}`} className="glass-card p-6 rounded-2xl group relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm font-bold text-accent mb-4 tracking-tight">{position.poolId}</p>
                  <div className="space-y-1 mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Allocated Capital</p>
                    <p className="text-2xl font-bold text-white">${position.amountUsd.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
                      onClick={() => onManagePositionDeposit(position.poolId)}
                    >
                      Deposit
                    </button>
                    <button
                      className="flex-1 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
                      onClick={() => onManagePositionWithdraw(position.poolId, position.amountUsd)}
                    >
                      Withdraw
                    </button>
                    <button
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
                      onClick={() => onManageRebalanceTarget(position.poolId)}
                    >
                      Set Rebalance Target
                    </button>
                  </div>
                </div>
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </article>
            ))}
          </div>
        </section>
      </div>

      <section id="pools" className="rounded-3xl glass-panel p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Pool Explorer</h2>
            <p className="text-slate-400 font-light">Real-time yield opportunities across the Starknet ecosystem.</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Live Feed • Sorted by APR</p>
          </div>
        </div>

        {!wallet && (
          <div className="mb-8 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            Connect your wallet to interact with liquidity pools.
          </div>
        )}

        {poolsLoading ? <LoadingSkeleton /> : null}
        {poolsError ? <p className="text-red-300">Failed to load pools.</p> : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePools.map((pool) => {
            const riskClass = pool.risk === "Low" ? "text-emerald-400" : pool.risk === "Medium" ? "text-amber-400" : "text-rose-400";
            const aprChange = typeof pool.aprChange24h === "number" ? pool.aprChange24h : null;
            const hasAprChange = aprChange !== null;
            const aprDirectionClass = hasAprChange && aprChange >= 0 ? "text-emerald-400" : "text-rose-400";
            const aprDirection = hasAprChange && aprChange >= 0 ? "▲" : "▼";

            return (
              <article key={pool.id} className="glass-card p-6 rounded-2xl relative group overflow-hidden flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{pool.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{pool.protocol}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                    <span className={`text-[10px] font-bold uppercase ${riskClass}`}>{pool.risk} Risk</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 mb-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current APR</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-accent">{pool.apr.toFixed(2)}%</span>
                      {hasAprChange && (
                        <span className={`text-[10px] font-bold ${aprDirectionClass}`}>
                          {aprDirection}{Math.abs(aprChange).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">TVL</p>
                    <p className="text-lg font-bold text-white">${(pool.tvlUsd / 1_000_000).toFixed(1)}M</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Min Deposit</p>
                    <p className="text-sm font-medium text-slate-300">{pool.minDepositUsd === null ? "No Minimum" : `$${pool.minDepositUsd}`}</p>
                  </div>
                </div>

                <button
                  className="mt-auto w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-slate-900 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-30 disabled:hover:shadow-none"
                  onClick={() => setSelectedPool(pool)}
                  disabled={!wallet}
                >
                  Enter Pool
                </button>

                {/* Decorative element */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />
              </article>
            );
          })}
        </div>
      </section>

      <section id="activity" className="rounded-3xl glass-panel p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Live Activity Log</h2>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Real-time update</span>
          </div>
        </div>

        {!wallet && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-white/10">
            <p className="text-slate-500">Connect wallet to view your agent&apos;s activity history.</p>
          </div>
        )}

        <div className="space-y-4">
          {activity.map((item) => (
            <article key={item.id} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${item.kind === "transaction"
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : item.title.includes("Triggered")
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                  {item.kind === "transaction" ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-accent transition-colors">{item.title}</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1">
                {item.kind === "transaction" ? (
                  <>
                    <p className="text-sm font-bold text-white">${item.amountUsd.toFixed(2)}</p>
                    <p className="text-xs font-medium text-slate-500 truncate max-w-[150px]">{item.poolLabel}</p>
                    <a href={getTxExplorerUrl(item.txHash)} target="_blank" rel="noreferrer" className="mt-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline">
                      View Explorer
                    </a>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">+{item.aprDelta.toFixed(1)}% APR Increase</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Rebalanced from {item.fromPool}</p>
                    <div className="flex gap-3 mt-2">
                      {item.txHashExit && <a href={getTxExplorerUrl(item.txHashExit)} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Exit Hash</a>}
                      {item.txHashEnter && <a href={getTxExplorerUrl(item.txHashEnter)} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline transition-colors">Enter Hash</a>}
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {wallet ? <DepositModal wallet={wallet} pool={selectedPool} onClose={() => setSelectedPool(null)} /> : null}
      {wallet ? (
        <WithdrawModal
          wallet={wallet}
          pool={selectedWithdrawPool}
          maxAmountUsd={selectedWithdrawMaxAmount}
          onClose={() => {
            setSelectedWithdrawPool(null);
            setSelectedWithdrawMaxAmount(0);
          }}
        />
      ) : null}
    </main>
  );
}
