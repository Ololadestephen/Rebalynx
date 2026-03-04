"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { disableRebalance, enableRebalance, fetchRebalanceStatus } from "@/services/rebalance";
import { signAuthMessage } from "@/services/wallet";

interface RebalancePanelProps {
  wallet: string;
  defaultPoolId: string;
}

export function RebalancePanel({ wallet, defaultPoolId }: RebalancePanelProps) {
  const statusQuery = useQuery({
    queryKey: ["rebalance-status", wallet],
    queryFn: () => fetchRebalanceStatus(wallet),
    enabled: Boolean(wallet)
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const targetPoolId = defaultPoolId || statusQuery.data?.pool || "";
      if (!targetPoolId) {
        throw new Error("No target pool selected for auto-rebalance.");
      }
      const message = "Enable Rebalynx auto-rebalance";
      const signature = await signAuthMessage(wallet, message);
      await enableRebalance({
        wallet,
        poolId: targetPoolId,
        threshold: statusQuery.data?.threshold || 1,
        signature,
        message
      });
    },
    onSuccess: () => {
      toast.success("Auto rebalance settings updated");
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error((error as Error).message);
    }
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const message = "Disable Rebalynx auto-rebalance";
      const signature = await signAuthMessage(wallet, message);
      await disableRebalance(wallet, signature, message);
    },
    onSuccess: () => {
      toast.success("Auto rebalance disabled");
      statusQuery.refetch();
    },
    onError: (error) => {
      toast.error((error as Error).message);
    }
  });

  const enabled = statusQuery.data?.enabled ?? false;
  const configuredPool = statusQuery.data?.pool ?? "";
  const selectedPool = defaultPoolId || configuredPool;
  const targetChanged = Boolean(selectedPool && configuredPool && selectedPool !== configuredPool);
  const isProcessing = enableMutation.isPending || disableMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${enabled ? "text-emerald-400" : "text-rose-400"}`}>
            {enabled ? "Active" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Threshold</span>
          <span className="text-xs font-bold text-white">{(statusQuery.data?.threshold ?? 1).toFixed(1)}% APR Δ</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Frequency</span>
          <span className="text-xs font-bold text-white">30m Cycle</span>
        </div>
      </div>

      {targetChanged && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] font-bold text-amber-400 leading-tight">
            Target has changed. Re-enable to apply the new pool selection.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          className={`w-full rounded-2xl px-6 py-4 font-bold transition-all ${enabled
              ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
              : "bg-accent text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            }`}
          onClick={() => (enabled ? disableMutation.mutate() : enableMutation.mutate())}
          disabled={isProcessing}
        >
          {isProcessing ? "Updating Agent..." : enabled ? "Stop Rebalancing" : "Start Auto-Rebalance"}
        </button>

        {enabled && targetChanged && (
          <button
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
            onClick={() => enableMutation.mutate()}
            disabled={isProcessing}
          >
            Apply Target Change
          </button>
        )}
      </div>
    </div>
  );
}
