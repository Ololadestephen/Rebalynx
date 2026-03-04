"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "@/hooks/use-wallet";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <WalletProvider>
        {children}
        <Toaster position="top-right" />
      </WalletProvider>
    </QueryClientProvider>
  );
}
