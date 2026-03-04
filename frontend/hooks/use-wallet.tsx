"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface WalletContextValue {
  wallet: string;
  setWallet: (wallet: string) => void;
  clearWallet: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "rebalynx_wallet";
const LEGACY_STORAGE_KEY = "starkyield_wallet";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWalletState] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setWalletState(saved);
      return;
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      setWalletState(legacy);
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  const setWallet = (value: string) => {
    setWalletState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  const clearWallet = () => {
    setWalletState("");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const ctx = useMemo(
    () => ({
      wallet,
      setWallet,
      clearWallet
    }),
    [wallet]
  );

  return <WalletContext.Provider value={ctx}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}
