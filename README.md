# Rebalynx

Rebalynx is a full-stack DeFi yield aggregator and automation agent built for **Starknet Sepolia**.

Users can:
- connect wallet (Argent X / Braavos)
- discover top Starknet yield pools
- deposit into a selected pool
- enable automated rebalancing when better APR opportunities appear

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Query
- starknet.js
- starkzap

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- node-cron
- starknet.js
- starkzap

### Shared
- `@starkyield/shared` workspace package for shared types/contracts

## Monorepo Structure

```text
rebalynx
├─ frontend
│  ├─ app
│  ├─ components
│  ├─ hooks
│  ├─ services
│  └─ utils
├─ backend
│  └─ src
│     ├─ api
│     ├─ config
│     ├─ middleware
│     ├─ models
│     ├─ services
│     ├─ workers
│     └─ __tests__
├─ shared
│  └─ src
└─ README.md
```

## Core Product Flow

1. User connects Starknet wallet
2. Frontend fetches pools sorted by APR descending
3. User deposits into selected pool
4. User enables auto-rebalance with threshold (e.g. 1%)
5. Worker checks monitored wallets every 30 minutes
6. If `bestAPR - currentAPR > threshold`, funds are rebalanced

## Current Implementation Notes

- Pool data is currently mock/provider-backed in `PoolService` for hackathon stability.
- Signature verification is a guarded hackathon-safe implementation and should be replaced by full account-contract verification for production.
- Transaction execution path includes retry logic and is ready for deeper Starkzap strategy integration.

## API Endpoints

### `GET /health`
Health check.

### `GET /api/pools`
Returns live Starknet pool list sorted by APR descending (source: DeFiLlama Starknet yields API).

### `GET /api/portfolio/:wallet`
Returns wallet-specific portfolio value from persisted deposits and current selected pool.

### `GET /api/transactions/:wallet`
Returns recent transaction history (deposit/rebalance records) for wallet.

### `GET /api/rebalance/activity/:wallet`
Returns recent rebalance monitoring activity timeline for wallet.

### `POST /api/deposit`
Creates a deposit transaction.

Request body:
```json
{
  "wallet": "0x123",
  "poolId": "starkswap_eth_usdc",
  "amount": "25"
}
```

### `POST /api/rebalance/enable`
Enables monitoring + rebalance for wallet.

Request body:
```json
{
  "wallet": "0x123",
  "poolId": "starkswap_eth_usdc",
  "threshold": 1,
  "signature": ["0x1", "0x2"],
  "message": "Enable Rebalynx auto-rebalance"
}
```

### `POST /api/rebalance/disable`
Disables monitoring for wallet.

### `GET /api/rebalance/status/:wallet`
Returns monitoring/rebalance status.

Example response:
```json
{
  "enabled": true,
  "monitoring": true,
  "pool": "starkswap_eth_usdc",
  "threshold": 1,
  "lastRebalance": "2026-03-04T10:00:00.000Z"
}
```

## Database Schema

Collection: `positions`

Example document:
```json
{
  "wallet": "0x123",
  "poolId": "starkswap_eth_usdc",
  "threshold": 1,
  "monitoring": true,
  "enabled": true,
  "lastRebalance": "2026-03-04T10:00:00.000Z"
}
```

## Environment Variables

### `backend/.env`

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/rebalynx
FRONTEND_ORIGIN=http://localhost:3000
STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/YOUR_ALCHEMY_API_KEY
REBALANCE_CRON=*/30 * * * *
TX_MAX_RETRIES=3
TX_SIMULATION_FALLBACK=false
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_TX_EXPLORER_BASE_URL=https://sepolia.voyager.online/tx/
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- MongoDB running locally or hosted
- Argent X or Braavos wallet extension
- Starknet Sepolia test funds

### Install

```bash
npm install
```

### Run frontend + backend + worker (auto)

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Worker: auto-started in `npm run dev`

## Testing

Run all tests:

```bash
npm test
```

Current coverage includes:
- backend API route tests (in-process handler tests)
- frontend component tests (`PoolCard`)

## Build

```bash
npm run build
```

## Production Process Setup (API + Worker Auto-Restart)

This project includes a PM2 config that runs both backend API and worker automatically.

### 1. Build

```bash
npm run build
```

### 2. Start production processes

```bash
npm run prod:up
```

### 3. Useful PM2 commands

```bash
npm run prod:restart
npm run prod:logs
npm run prod:down
```

Note: Install PM2 globally first if needed:

```bash
npm install -g pm2
```

## App Pages

- `/dashboard` - main DeFi UI
- `/pools/[id]` - detailed view for selected pool
- `/transactions` - wallet transaction history
- `/rebalance/activity` - rebalance decision/execution timeline

## Security Controls Included

- request validation with `zod`
- API rate limiting (`express-rate-limit`)
- wallet signature verification guard
- safe rebalance decision checks
- transaction retry logic

## Starknet Sepolia Wallet Setup

1. Open wallet extension (Argent X or Braavos)
2. Switch network to **Starknet Sepolia**
3. Fund wallet with testnet assets
4. Connect wallet from landing/dashboard

## Production Hardening Suggestions

- Replace mock pool source with live Starkzap/Starknet data adapters
- Implement nonce/challenge-based signature verification to prevent replay
- Add persistent rebalance event logs + alerting
- Add queue/locking for concurrent wallet rebalance safety
- Add e2e tests for deposit + rebalance lifecycle
