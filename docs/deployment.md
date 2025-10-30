# Deployment Guide

## 1. Prerequisites
- Node.js 20+, pnpm 8+
- A Sepolia RPC endpoint (Infura/Alchemy/etc.)
- Wallet private key funded with Sepolia ETH
- Optional: PowerShell 7 for helper scripts

## 2. Compile & Test Contracts
```bash
cd contracts
pnpm install
pnpm hardhat compile
pnpm hardhat test
```

## 3. Deploy to Sepolia
Create `contracts/.env` (not committed) with:
```ini
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>
PRIVATE_KEY=0x...
FH_EVM_EXECUTOR_CONTRACT=0x848B0066793BcC60346Da1F49049357399B8D595
```
Then run:
```bash
pnpm hardhat run deploy/00_deploy_cipher_clash.ts --network sepolia
```
Record the printed registry address and sample room IDs.

## 4. Configure the Frontend
Copy `frontend/.env.example` to `.env` and fill in:
```ini
VITE_PUBLIC_RPC_URL=<same RPC>
VITE_PUBLIC_REGISTRY_ADDRESS=<registry address>
VITE_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.cloud
VITE_PUBLIC_ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
VITE_PUBLIC_KMS_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
VITE_PUBLIC_INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
VITE_PUBLIC_DECRYPTION_CONTRACT=0xa02Cda4Ca3a71D7C46997716F4283aa851C28812
VITE_PUBLIC_DECRYPTION_ADDRESS=0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1
VITE_PUBLIC_INPUT_VERIFICATION_ADDRESS=0x7048C39f048125eDa9d678AEbaDfB22F7900a29F
VITE_PUBLIC_GATEWAY_CHAIN_ID=55815
VITE_PUBLIC_WALLETCONNECT_ID=<your project id>
```

## 5. Local Preview
```bash
cd frontend
pnpm install
pnpm run dev
```
Open the shown URL (default http://localhost:5173) and connect your wallet.

## 6. Production Build & Hosting
```bash
pnpm run build
pnpm run preview   # optional sanity check
```
Deploy the `frontend/dist` folder to a static host (Vercel, Netlify, Cloudflare Pages, etc.) and replicate the `.env` variables through the platform UI.

## 7. Demo Checklist
1. Create a room with a small stake (e.g., 0.00001 ETH).
2. Join from a second wallet and submit encrypted moves.
3. Trigger `Finalize & Payout`.
4. Show the leaderboard update and timeline events.
5. (Optional) record a short video following the steps above.

If the official relayer throttles requests, switch temporarily to a self-hosted proxy as described in `scripts/demo-runbook.md`. For the final submission, use the official relayer endpoint for credibility.
