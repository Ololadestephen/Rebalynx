# Rebalynx

Rebalynx is a full-stack DeFi yield aggregator and automation agent on Starknet Sepolia.

Users can connect a wallet, discover high-yield pools, deposit funds, enable auto-rebalance, and monitor portfolio/activity in a single-page dashboard.

## Features

- Wallet connect (Argent X / Braavos)
- Live Starknet pool discovery (APR-sorted)
- On-chain deposit flow with explorer links
- Position management (deposit more, cash out)
- Auto-rebalance controls (enable/disable, target pool)
- Background worker for scheduled rebalance checks
- Portfolio, positions, and activity tracking
- Strong API validation, rate limiting, and retry guards

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- starknet.js
- starkzap
- Vercel Analytics

### Backend

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- node-cron
- starknet.js
- zod

### Shared

- `@starkyield/shared` for shared types/contracts

## Architecture

- Monorepo with workspaces: `frontend`, `backend`, `shared`
- Frontend calls backend REST API
- Backend persists positions/transactions/activity in MongoDB
- Worker checks APR deltas every 30 minutes and executes rebalance logic

## Repository Structure

```text
rebalynx
├─ frontend
│  ├─ app
│  ├─ components
│  ├─ hooks
│  ├─ services
│  └─ utils
├─ backend
│  ├─ api                 # Vercel serverless entry
│  └─ src
│     ├─ api              # Express routes
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

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or Atlas)
- Starknet Sepolia wallet + test funds

## Environment Variables

### Backend (`backend/.env` for local)

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/rebalynx
FRONTEND_ORIGIN=http://localhost:3000
STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/YOUR_ALCHEMY_KEY
REBALANCE_CRON=*/30 * * * *
TX_MAX_RETRIES=3
TX_SIMULATION_FALLBACK=false
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_TX_EXPLORER_BASE_URL=https://sepolia.voyager.online/tx/
```

## Local Development

```bash
npm install
npm run dev
```

This starts:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`
- worker: auto-started by root `dev` script

## Scripts

### Root

- `npm run dev` - frontend + backend + worker
- `npm run build` - build shared + backend + frontend
- `npm run test` - run all tests
- `npm run lint` - lint backend/frontend

### Backend

- `npm run dev --workspace backend`
- `npm run worker --workspace backend`
- `npm run build --workspace backend`

### Frontend

- `npm run dev --workspace frontend`
- `npm run build --workspace frontend`


## Deployment

### Production Layout

- Frontend: Vercel project (root: `frontend`)
- Backend: separate Vercel project (root: `backend`)
- Database: MongoDB Atlas

### Backend Vercel Env

- `MONGODB_URI`
- `FRONTEND_ORIGIN=https://rebalynx.vercel.app`
- `STARKNET_RPC_URL=...`

### Frontend Vercel Env

- `NEXT_PUBLIC_BACKEND_URL=https://<backend-domain>`
- `NEXT_PUBLIC_STARKNET_RPC_URL=...`
- `NEXT_PUBLIC_TX_EXPLORER_BASE_URL=https://sepolia.voyager.online/tx/`

## PM2 Production Mode (non-serverless)

If deploying on a VM/container, PM2 config is included:

```bash
npm run build
npm run prod:up
npm run prod:logs
npm run prod:restart
npm run prod:down
```

## Troubleshooting

### "Failed to load pools"

- Verify `NEXT_PUBLIC_BACKEND_URL` points to backend domain
- Verify backend `/api/pools` returns 200

### "Database unavailable. Deposit not persisted."

- Check backend `MONGODB_URI`
- Check Atlas network allowlist and DB credentials
- Redeploy backend after env changes

### `Cannot GET /`

- Backend now provides root health JSON; if missing, deploy latest backend


## Security Notes

- zod input validation on API routes
- API rate limiting (`express-rate-limit`)
- Signature checks for rebalance actions
- Retry/failure handling for Starknet RPC operations

## License

Hackathon prototype. Add a license file (`MIT`, `Apache-2.0`, etc.) before public distribution.
