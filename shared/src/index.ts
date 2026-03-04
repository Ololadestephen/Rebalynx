export type RiskLevel = "Low" | "Medium" | "High";

export interface Pool {
  id: string;
  name: string;
  protocol: string;
  apr: number;
  aprChange24h: number | null;
  tvlUsd: number;
  risk: RiskLevel;
  minDepositUsd: number | null;
  assetPair: string;
}

export interface Position {
  wallet: string;
  poolId: string;
  threshold: number;
  monitoring: boolean;
  lastRebalance?: string;
  enabled: boolean;
}

export interface RebalanceStatusResponse {
  enabled: boolean;
  pool: string | null;
  threshold: number;
  monitoring: boolean;
  lastRebalance?: string;
}

export interface EnableRebalanceRequest {
  wallet: string;
  poolId: string;
  threshold: number;
  signature: string[];
  message: string;
}

export interface DisableRebalanceRequest {
  wallet: string;
  signature: string[];
  message: string;
}

export interface DepositRequest {
  wallet: string;
  poolId: string;
  amount: string;
}

export interface PortfolioResponse {
  wallet: string;
  totalValueUsd: number;
  currentPool: Pool | null;
  depositedUsd: number;
  monitoringEnabled: boolean;
}

export type TransactionType = "deposit" | "withdraw" | "rebalance_exit" | "rebalance_enter";

export interface TransactionRecord {
  wallet: string;
  poolId: string;
  amountUsd: number;
  txHash: string;
  type: TransactionType;
  createdAt: string;
}

export interface RebalanceActivityRecord {
  wallet: string;
  fromPool: string;
  toPool: string;
  aprDelta: number;
  threshold: number;
  triggered: boolean;
  reason: string;
  txHashExit?: string;
  txHashEnter?: string;
  createdAt: string;
}

export interface PositionSummary {
  wallet: string;
  poolId: string;
  amountUsd: number;
  lastUpdated: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
