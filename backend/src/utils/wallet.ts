export function normalizeWalletAddress(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const noPrefix = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  const compact = noPrefix.replace(/^0+/, "");
  const normalizedBody = compact.length > 0 ? compact : "0";
  return `0x${normalizedBody}`;
}
