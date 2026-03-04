"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState } from "react";
import { WalletConnect } from "@/components/wallet-connect";

const NAV_ITEMS = [
  { href: "#overview", label: "Overview" },
  { href: "#positions", label: "Positions" },
  { href: "#rebalance", label: "Rebalance" },
  { href: "#pools", label: "Pools" },
  { href: "#activity", label: "Activity" }
] as const;

export function TopNav() {
  const { wallet } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full bg-accent ai-pulse" />
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-accent transition-colors">
              Rebalynx
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Agent Active</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
            <div className={`h-2 w-2 rounded-full ${wallet ? 'bg-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-600'}`} />
            {mounted && wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Disconnected"}
          </div>
          <div className="block">
            <WalletConnect compact />
          </div>
        </div>
      </div>
    </header>
  );
}
