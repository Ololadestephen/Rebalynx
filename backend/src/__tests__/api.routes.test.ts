import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { createRebalanceRouter } from "../api/rebalance.routes.js";
import { createPoolRouter } from "../api/pool.routes.js";
import { createDepositRouter } from "../api/deposit.routes.js";
import { createWithdrawRouter } from "../api/withdraw.routes.js";
import { RebalanceService } from "../services/rebalance.service.js";
import { SignatureService } from "../services/signature.service.js";
import { PoolService } from "../services/pool.service.js";
import { StarknetService } from "../services/starknet.service.js";

interface MockRes {
  statusCode: number;
  body: unknown;
}

async function invokeRoute(
  router:
    | ReturnType<typeof createRebalanceRouter>
    | ReturnType<typeof createPoolRouter>
    | ReturnType<typeof createDepositRouter>
    | ReturnType<typeof createWithdrawRouter>,
  method: "get" | "post",
  path: string,
  options: { body?: unknown; params?: Record<string, string> } = {}
): Promise<MockRes> {
  const layer = router.stack.find((stackLayer) => {
    const route = (stackLayer as { route?: { path: string; methods: Record<string, boolean> } }).route;
    return route?.path === path && Boolean(route.methods[method]);
  });

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  const req = {
    body: options.body ?? {},
    params: options.params ?? {}
  } as Request;

  const resState: MockRes = {
    statusCode: 200,
    body: undefined
  };

  const res = {
    status(code: number) {
      resState.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      resState.body = payload;
      return this;
    }
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;
  const routeLayer = layer as { route: { stack: Array<{ handle: (req: Request, res: Response, next: NextFunction) => unknown }> } };

  await routeLayer.route.stack[0].handle(req, res, next);

  return resState;
}

describe("rebalance routes", () => {
  it("enables rebalance", async () => {
    const rebalanceService = {
      enable: vi.fn(async () => undefined),
      disable: vi.fn(async () => undefined),
      status: vi.fn(async () => ({ enabled: true, monitoring: true, pool: "starkswap_eth_usdc", threshold: 1 })),
      runMonitorTick: vi.fn(async () => undefined)
    } as unknown as RebalanceService;

    const signatureService = {
      verifySignature: vi.fn(() => true)
    } as unknown as SignatureService;

    const router = createRebalanceRouter(rebalanceService, signatureService);

    const response = await invokeRoute(router, "post", "/enable", {
      body: {
        wallet: "0x123",
        poolId: "starkswap_eth_usdc",
        threshold: 1,
        signature: ["0x1", "0x2"],
        message: "enable"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(rebalanceService.enable).toHaveBeenCalledWith("0x123", "starkswap_eth_usdc", 1);
  });

  it("returns status", async () => {
    const rebalanceService = {
      enable: vi.fn(async () => undefined),
      disable: vi.fn(async () => undefined),
      status: vi.fn(async () => ({ enabled: true, monitoring: true, pool: "starkswap_eth_usdc", threshold: 1 })),
      runMonitorTick: vi.fn(async () => undefined)
    } as unknown as RebalanceService;

    const signatureService = {
      verifySignature: vi.fn(() => true)
    } as unknown as SignatureService;

    const router = createRebalanceRouter(rebalanceService, signatureService);
    const response = await invokeRoute(router, "get", "/status/:wallet", {
      params: { wallet: "0x123" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ enabled: true, pool: "starkswap_eth_usdc" });
  });
});

describe("pool and deposit routes", () => {
  it("returns sorted pools", async () => {
    const poolService = {
      getTopPools: vi.fn(async () => [
        {
          id: "a",
          name: "A",
          protocol: "Alpha",
          apr: 12,
          aprChange24h: 0.4,
          tvlUsd: 10,
          risk: "Low",
          minDepositUsd: 1,
          assetPair: "ETH/USDC"
        },
        {
          id: "b",
          name: "B",
          protocol: "Beta",
          apr: 8,
          aprChange24h: -0.1,
          tvlUsd: 20,
          risk: "Medium",
          minDepositUsd: 1,
          assetPair: "USDC"
        }
      ]),
      getPoolById: vi.fn(async () => null),
      getBestPool: vi.fn(async () => null)
    } as unknown as PoolService;

    const router = createPoolRouter(poolService);
    const response = await invokeRoute(router, "get", "/");

    expect(response.statusCode).toBe(200);
    const body = response.body as Array<{ apr: number }>;
    expect(body[0].apr).toBeGreaterThanOrEqual(body[1].apr);
  });

  it("handles deposit", async () => {
    const poolService = {
      getTopPools: vi.fn(async () => []),
      getPoolById: vi.fn(async () => ({
        id: "starkswap_eth_usdc",
        name: "StarkSwap ETH/USDC",
        protocol: "StarkSwap",
        apr: 14.2,
        aprChange24h: 0.9,
        tvlUsd: 3_400_000,
        risk: "Medium",
        minDepositUsd: 10,
        assetPair: "ETH/USDC"
      })),
      getBestPool: vi.fn(async () => null)
    } as unknown as PoolService;

    const starknetService = {
      executeWithRetry: vi.fn(async () => ({ txHash: "0xabc" }))
    } as unknown as StarknetService;

    const router = createDepositRouter(poolService, starknetService);
    const response = await invokeRoute(router, "post", "/", {
      body: {
        wallet: "0x123",
        poolId: "starkswap_eth_usdc",
        amount: "20"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ status: "success", txHash: "0xabc" });
  });

  it("handles withdraw", async () => {
    const poolService = {
      getTopPools: vi.fn(async () => []),
      getPoolById: vi.fn(async () => ({
        id: "starkswap_eth_usdc",
        name: "StarkSwap ETH/USDC",
        protocol: "StarkSwap",
        apr: 14.2,
        aprChange24h: 0.9,
        tvlUsd: 3_400_000,
        risk: "Medium",
        minDepositUsd: 10,
        assetPair: "ETH/USDC"
      })),
      getBestPool: vi.fn(async () => null)
    } as unknown as PoolService;

    const starknetService = {
      executeWithRetry: vi.fn(async () => ({ txHash: "0xdef" }))
    } as unknown as StarknetService;

    const router = createWithdrawRouter(poolService, starknetService);
    const response = await invokeRoute(router, "post", "/", {
      body: {
        wallet: "0x123",
        poolId: "starkswap_eth_usdc",
        amount: "5"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ status: "success", txHash: "0xdef" });
  });
});
