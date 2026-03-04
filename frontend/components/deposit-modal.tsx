"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Pool } from "@starkyield/shared";
import { depositToPool } from "@/services/deposit";
import { getTxExplorerUrl } from "@/utils/explorer";
import { executeOnChainDeposit } from "@/services/wallet";

interface DepositModalProps {
  wallet: string;
  pool: Pool | null;
  onClose: () => void;
}

export function DepositModal({ wallet, pool, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("10");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!txHash) {
      return;
    }
    const queryKeys: Array<readonly [string, string]> = [
      ["portfolio", wallet],
      ["positions", wallet],
      ["balances", wallet],
      ["transactions", wallet],
      ["rebalance-activity", wallet]
    ];

    const interval = window.setInterval(() => {
      void Promise.all(
        queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );
    }, 5000);

    const closeTimeout = window.setTimeout(() => {
      setTxHash(null);
      onClose();
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(closeTimeout);
    };
  }, [onClose, queryClient, txHash, wallet]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pool) {
        throw new Error("No pool selected");
      }

      const txHash = await executeOnChainDeposit(wallet, pool, amount);
      await depositToPool({
        wallet,
        poolId: pool.id,
        amount,
        txHash
      });
      return { txHash };
    },
    onSuccess: (data) => {
      setErrorMessage(null);
      setTxHash(data.txHash);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio", wallet] }),
        queryClient.invalidateQueries({ queryKey: ["positions", wallet] }),
        queryClient.invalidateQueries({ queryKey: ["balances", wallet] }),
        queryClient.invalidateQueries({ queryKey: ["transactions", wallet] }),
        queryClient.invalidateQueries({ queryKey: ["rebalance-activity", wallet] })
      ]);
      toast.success(`Deposit successful: ${data.txHash.slice(0, 12)}...`);
    },
    onError: (error) => {
      setTxHash(null);
      setErrorMessage((error as Error).message);
      toast.error((error as Error).message);
    }
  });

  if (!pool) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl glass-panel p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold tracking-tight text-white mb-1">Deposit Funds</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-8">{pool.name}</p>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                Amount to Deposit (USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-accent/50 transition-all"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-[10px] font-bold text-slate-300">USD</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-accent px-6 py-4 font-bold text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Connecting..." : "Confirm Deposit"}
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white hover:bg-white/10 transition-all"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>

          {mutation.isPending && (
            <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-xs font-medium text-cyan-400">Transaction in progress on Starknet...</p>
            </div>
          )}

          {txHash && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Success</p>
              </div>
              <p className="mb-2 text-[10px] text-emerald-300">Closing automatically in 5 seconds...</p>
              <p className="text-[10px] text-slate-400 break-all mb-4">{txHash}</p>
              <a
                href={getTxExplorerUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:underline"
              >
                View on Voyager
              </a>
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs font-bold text-rose-400 mb-1 uppercase tracking-widest">Transaction Failed</p>
              <p className="text-[10px] text-rose-300/80 leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />
      </div>
    </div>
  );
}
