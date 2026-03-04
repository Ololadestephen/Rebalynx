const TX_EXPLORER_BASE =
  process.env.NEXT_PUBLIC_TX_EXPLORER_BASE_URL ?? "https://sepolia.voyager.online/tx/";

export function getTxExplorerUrl(txHash: string): string {
  const base = TX_EXPLORER_BASE.endsWith("/") ? TX_EXPLORER_BASE : `${TX_EXPLORER_BASE}/`;
  return `${base}${txHash}`;
}
