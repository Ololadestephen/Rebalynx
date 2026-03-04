"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { connectArgentX, connectBraavos } from "@/services/wallet";
import { useWallet } from "@/hooks/use-wallet";

interface WalletConnectProps {
  onConnected?: (wallet: string) => void;
  compact?: boolean;
}

export function WalletConnect({ onConnected, compact = false }: WalletConnectProps) {
  const [loading, setLoading] = useState<"argent" | "braavos" | null>(null);
  const { wallet, setWallet, clearWallet } = useWallet();

  const connect = async (type: "argent" | "braavos") => {
    setLoading(type);

    try {
      const wallet = type === "argent" ? await connectArgentX() : await connectBraavos();
      setWallet(wallet);
      onConnected?.(wallet);
      toast.success(`Wallet connected: ${wallet.slice(0, 8)}...${wallet.slice(-4)}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "items-center" : ""}`}>
      {!wallet ? (
        <>
          <button
            className={`font-bold text-slate-900 transition-all disabled:opacity-50 ${
              compact
                ? "rounded-xl bg-accent px-3 py-2 text-xs"
                : "flex-1 min-w-[200px] rounded-2xl bg-accent px-6 py-4 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            }`}
            onClick={() => connect("argent")}
            disabled={loading !== null}
          >
            {loading === "argent" ? "Linking Argent X..." : compact ? "Argent X" : "Connect Argent X"}
          </button>
          <button
            className={`font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50 ${
              compact
                ? "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                : "flex-1 min-w-[200px] rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
            }`}
            onClick={() => connect("braavos")}
            disabled={loading !== null}
          >
            {loading === "braavos" ? "Linking Braavos..." : compact ? "Braavos" : "Connect Braavos"}
          </button>
        </>
      ) : (
        <button
          className={`font-bold text-rose-400 hover:bg-rose-500/10 transition-all ${
            compact
              ? "rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs"
              : "rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-4"
          }`}
          onClick={() => {
            clearWallet();
            toast.success("Wallet disconnected");
          }}
        >
          {compact ? "Disconnect" : "Disconnect Session"}
        </button>
      )}
    </div>
  );
}
