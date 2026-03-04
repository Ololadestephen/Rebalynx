"use client";

import type { Pool } from "@starkyield/shared";
import { cairo, RpcProvider } from "starknet";

type EnableResult =
  | string
  | string[]
  | {
      selectedAddress?: string;
      address?: string;
      account?: { address?: string; execute?: InjectedAccount["execute"] };
    };

interface InjectedWallet {
  enable?: (options?: unknown) => Promise<EnableResult>;
  request?: (payload: { type?: string; method?: string; params?: unknown }) => Promise<unknown>;
  selectedAddress?: string;
  address?: string;
  name?: string;
  id?: string;
  account?: InjectedAccount;
}

interface InjectedAccount {
  address?: string;
  execute: (calls: Array<{ contractAddress: string; entrypoint: string; calldata: unknown[] }>) => Promise<{
    transaction_hash?: string;
    transactionHash?: string;
  }>;
}

declare global {
  interface Window {
    starknet_argentX?: InjectedWallet;
    starknet_braavos?: InjectedWallet;
    starknet?: InjectedWallet;
  }
}

function extractAddress(enableResult: EnableResult | undefined, wallet: InjectedWallet): string | null {
  if (typeof enableResult === "string" && enableResult) {
    return enableResult;
  }
  if (Array.isArray(enableResult) && typeof enableResult[0] === "string") {
    return enableResult[0];
  }
  if (enableResult && typeof enableResult === "object" && !Array.isArray(enableResult)) {
    const value = enableResult as Exclude<EnableResult, string | string[]>;
    if (typeof value.selectedAddress === "string" && value.selectedAddress) {
      return value.selectedAddress;
    }
    if (typeof value.address === "string" && value.address) {
      return value.address;
    }
    if (value.account?.address) {
      return value.account.address;
    }
  }
  if (wallet.selectedAddress) {
    return wallet.selectedAddress;
  }
  if (wallet.address) {
    return wallet.address;
  }
  if (wallet.account?.address) {
    return wallet.account.address;
  }
  return null;
}

function detectWallet(type: "argent" | "braavos"): InjectedWallet | null {
  const direct = type === "argent" ? window.starknet_argentX : window.starknet_braavos;
  if (direct) {
    return direct;
  }

  const generic = window.starknet;
  if (!generic) {
    return null;
  }

  const identity = `${generic.id ?? ""} ${generic.name ?? ""}`.toLowerCase();
  if (type === "argent" && identity.includes("argent")) {
    return generic;
  }
  if (type === "braavos" && identity.includes("braavos")) {
    return generic;
  }

  return generic;
}

let connectedWallet: InjectedWallet | null = null;
let connectedAccount: InjectedAccount | null = null;
const SEPOLIA_CHAIN_IDS = new Set(["SN_SEPOLIA", "0X534E5F5345504F4C4941"]);

function decodeHexAscii(hexValue: string): string {
  const value = hexValue.startsWith("0x") ? hexValue.slice(2) : hexValue;
  if (!/^[0-9a-fA-F]+$/.test(value) || value.length % 2 !== 0) {
    return "";
  }

  let output = "";
  for (let i = 0; i < value.length; i += 2) {
    const code = parseInt(value.slice(i, i + 2), 16);
    if (code >= 32 && code <= 126) {
      output += String.fromCharCode(code);
    }
  }
  return output;
}

function isSepoliaChain(chainId: string | null): boolean {
  if (!chainId) {
    return false;
  }

  const normalized = chainId.trim().toUpperCase();
  if (SEPOLIA_CHAIN_IDS.has(normalized)) {
    return true;
  }
  if (normalized.includes("SEPOLIA")) {
    return true;
  }
  if (normalized.startsWith("0X")) {
    const decoded = decodeHexAscii(normalized).toUpperCase();
    if (decoded.includes("SEPOLIA")) {
      return true;
    }
  }
  return false;
}

async function readWalletChainId(wallet: InjectedWallet): Promise<string | null> {
  if (!wallet.request) {
    return null;
  }

  const attempts = [
    { type: "wallet_getStarknetChainId" },
    { method: "wallet_getStarknetChainId" },
    { type: "wallet_requestChainId" },
    { method: "wallet_requestChainId" }
  ];

  for (const payload of attempts) {
    try {
      const result = await wallet.request(payload);
      if (typeof result === "string" && result) {
        return result;
      }
      if (result && typeof result === "object" && "chainId" in result) {
        const id = (result as { chainId?: unknown }).chainId;
        if (typeof id === "string" && id) {
          return id;
        }
      }
    } catch {
      // try next request shape
    }
  }

  return null;
}

async function requestSepoliaSwitch(wallet: InjectedWallet): Promise<boolean> {
  if (!wallet.request) {
    return false;
  }

  const attempts = [
    { type: "wallet_switchStarknetChain", params: { chainId: "SN_SEPOLIA" } },
    { type: "wallet_switchStarknetChain", params: ["SN_SEPOLIA"] },
    { method: "wallet_switchStarknetChain", params: [{ chainId: "SN_SEPOLIA" }] },
    { method: "wallet_switchStarknetChain", params: ["SN_SEPOLIA"] },
    { method: "wallet_switchStarknetChain", params: [{ chainId: "0x534e5f5345504f4c4941" }] }
  ];

  for (const payload of attempts) {
    try {
      await wallet.request(payload);
      return true;
    } catch {
      // try next request shape
    }
  }

  return false;
}

async function ensureWalletOnSepolia(wallet: InjectedWallet): Promise<void> {
  const chainId = await readWalletChainId(wallet);
  if (chainId && isSepoliaChain(chainId)) {
    return;
  }

  const identity = `${wallet.id ?? ""} ${wallet.name ?? ""}`.toLowerCase();
  const isBraavos = identity.includes("braavos") || wallet === window.starknet_braavos;

  const switched = await requestSepoliaSwitch(wallet);
  if (!switched) {
    // Some wallets (notably Braavos) may not expose switch methods consistently.
    // Do not hard-block connect in this case.
    if (isBraavos || chainId === null) {
      return;
    }
    throw new Error("Please switch wallet network to Starknet Sepolia and try again.");
  }

  const nextChainId = await readWalletChainId(wallet);
  if (isBraavos) {
    // Braavos can report stale/non-standard chain IDs right after switch.
    // If switch was accepted, proceed and let transaction execution be the final guard.
    return;
  }

  if (nextChainId && !isSepoliaChain(nextChainId)) {
    throw new Error("Wallet is still not on Starknet Sepolia. Please switch network manually.");
  }
}

function extractAccount(enableResult: EnableResult | undefined, wallet: InjectedWallet): InjectedAccount | null {
  if (enableResult && typeof enableResult === "object" && !Array.isArray(enableResult)) {
    const value = enableResult as Exclude<EnableResult, string | string[]>;
    if (value.account && typeof value.account.execute === "function") {
      return value.account as InjectedAccount;
    }
  }

  if (wallet.account && typeof wallet.account.execute === "function") {
    return wallet.account as InjectedAccount;
  }

  return null;
}

async function connectWallet(type: "argent" | "braavos"): Promise<string> {
  const wallet = detectWallet(type);
  if (!wallet || typeof wallet.enable !== "function") {
    throw new Error(type === "argent" ? "Argent X not found" : "Braavos not found");
  }

  const result = await wallet.enable({ starknetVersion: "v5" });
  const address = extractAddress(result, wallet);
  const account = extractAccount(result, wallet);

  if (!address) {
    throw new Error("Wallet connected but address not found");
  }

  connectedWallet = wallet;
  connectedAccount = account;
  await ensureWalletOnSepolia(wallet);

  return address;
}

export async function connectArgentX(): Promise<string> {
  return connectWallet("argent");
}

export async function connectBraavos(): Promise<string> {
  return connectWallet("braavos");
}

export async function signAuthMessage(_wallet: string, message: string): Promise<string[]> {
  const hex = Array.from(new TextEncoder().encode(message))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 62);
  return ["0x1", `0x${hex}`];
}

export const provider = new RpcProvider({
  nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? "https://free-rpc.nethermind.io/sepolia-juno/v0_7"
});

const TOKEN_ADDRESSES = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  USDC: "0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343"
} as const;

interface DepositTokenConfig {
  symbol: "ETH" | "STRK" | "USDC";
  address: string;
  decimals: number;
}

function resolvePoolToken(pool: Pool): DepositTokenConfig {
  const symbol = pool.assetPair.toUpperCase();
  const parts = symbol.split(/[^A-Z0-9.]+/).filter(Boolean);

  // Prefer stablecoin leg for easier testing and fewer insufficient-balance errors.
  if (parts.some((p) => p === "USDC" || p === "USDC.E")) {
    return { symbol: "USDC", address: TOKEN_ADDRESSES.USDC, decimals: 6 };
  }
  if (parts.some((p) => p === "STRK")) {
    return { symbol: "STRK", address: TOKEN_ADDRESSES.STRK, decimals: 18 };
  }
  if (parts.some((p) => p === "ETH" || p === "WETH")) {
    return { symbol: "ETH", address: TOKEN_ADDRESSES.ETH, decimals: 18 };
  }

  throw new Error(`Unsupported deposit token for pool ${pool.assetPair}.`);
}

async function getTokenBalanceRaw(walletAddress: string, tokenAddress: string): Promise<bigint> {
  const response = await provider.callContract(
    {
      contractAddress: tokenAddress,
      entrypoint: "balanceOf",
      calldata: [walletAddress]
    },
    "latest"
  );

  const result = Array.isArray(response)
    ? response
    : ((response as { result?: string[] }).result ?? []);

  if (result.length < 2) {
    return 0n;
  }

  const low = BigInt(result[0]);
  const high = BigInt(result[1]);
  return (high << 128n) + low;
}

async function ensureConnectedAccount(): Promise<InjectedAccount> {
  if (connectedWallet) {
    await ensureWalletOnSepolia(connectedWallet);
  }

  if (connectedAccount) {
    return connectedAccount;
  }

  if (connectedWallet?.enable) {
    const result = await connectedWallet.enable({ starknetVersion: "v5" });
    const account = extractAccount(result, connectedWallet);
    if (account) {
      connectedAccount = account;
      return account;
    }
  }

  const fallbackWallet = detectWallet("argent") ?? detectWallet("braavos");
  if (!fallbackWallet || typeof fallbackWallet.enable !== "function") {
    throw new Error("No connected Starknet wallet account found. Reconnect wallet and retry.");
  }

  const result = await fallbackWallet.enable({ starknetVersion: "v5" });
  const account = extractAccount(result, fallbackWallet);
  if (!account) {
    throw new Error("Wallet account execution interface unavailable.");
  }

  connectedWallet = fallbackWallet;
  connectedAccount = account;
  return account;
}

export async function executeOnChainDeposit(walletAddress: string, pool: Pool, amount: string): Promise<string> {
  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid deposit amount");
  }

  const account = await ensureConnectedAccount();
  const token = resolvePoolToken(pool);
  const scaled = BigInt(Math.floor(amountNumber * 10 ** token.decimals));
  const balance = await getTokenBalanceRaw(walletAddress, token.address);

  if (scaled > balance) {
    throw new Error(
      `Insufficient ${token.symbol} balance for this deposit amount. Reduce amount or fund wallet first.`
    );
  }

  const uint256 = cairo.uint256(scaled);
  const receiver = process.env.NEXT_PUBLIC_DEPOSIT_RECEIVER_ADDRESS ?? walletAddress;

  const tx = await account.execute([
    {
      contractAddress: token.address,
      entrypoint: "transfer",
      calldata: [receiver, uint256.low, uint256.high]
    }
  ]);

  const txHash = tx.transaction_hash ?? tx.transactionHash;
  if (!txHash) {
    throw new Error("Wallet returned no transaction hash");
  }

  await provider.waitForTransaction(txHash);
  return txHash;
}

export async function executeOnChainWithdraw(walletAddress: string, pool: Pool, amount: string): Promise<string> {
  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid withdraw amount");
  }

  const account = await ensureConnectedAccount();
  const token = resolvePoolToken(pool);
  const scaled = BigInt(Math.floor(amountNumber * 10 ** token.decimals));
  const balance = await getTokenBalanceRaw(walletAddress, token.address);

  if (scaled > balance) {
    throw new Error(
      `Insufficient ${token.symbol} balance for this withdraw amount. Reduce amount or fund wallet first.`
    );
  }

  const uint256 = cairo.uint256(scaled);

  const tx = await account.execute([
    {
      contractAddress: token.address,
      entrypoint: "transfer",
      calldata: [walletAddress, uint256.low, uint256.high]
    }
  ]);

  const txHash = tx.transaction_hash ?? tx.transactionHash;
  if (!txHash) {
    throw new Error("Wallet returned no transaction hash");
  }

  await provider.waitForTransaction(txHash);
  return txHash;
}
