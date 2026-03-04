import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Providers from "./providers";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Rebalynx",
  description: "Starknet yield aggregator and automation agent"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TopNav />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
