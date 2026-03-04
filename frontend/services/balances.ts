import { provider } from "./wallet";

const TOKENS = {
  STRK: {
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18
  },
  USDC: {
    address: "0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343",
    decimals: 6
  }
} as const;

interface TokenBalances {
  strk: number;
  usdc: number;
}

function toAmount(lowHex: string, highHex: string, decimals: number): number {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  const value = (high << 128n) + low;
  const scale = 10 ** decimals;
  return Number(value) / scale;
}

async function balanceOf(wallet: string, tokenAddress: string, decimals: number): Promise<number> {
  const response = await provider.callContract(
    {
      contractAddress: tokenAddress,
      entrypoint: "balanceOf",
      calldata: [wallet]
    },
    "latest"
  );

  const result = Array.isArray(response)
    ? response
    : ((response as { result?: string[] }).result ?? []);
  if (result.length < 2) {
    return 0;
  }

  return toAmount(result[0], result[1], decimals);
}

export async function fetchTokenBalances(wallet: string): Promise<TokenBalances> {
  const [strk, usdc] = await Promise.all([
    balanceOf(wallet, TOKENS.STRK.address, TOKENS.STRK.decimals),
    balanceOf(wallet, TOKENS.USDC.address, TOKENS.USDC.decimals)
  ]);

  return {
    strk,
    usdc
  };
}
