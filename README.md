# CipherClash – Play Rock, Paper, Scissors Without Revealing Your Hand

CipherClash is a cheeky little duel where cryptography does the bluffing for you.  
Two players stake a tiny amount of ETH, secretly choose Rock, Paper, or Scissors, and let fully homomorphic encryption (FHE) decide the winner—no peeking, no leaks, just pure encrypted rivalry.

---

## Why it’s fun (and useful)

- **Moves stay secret**  
  Hands are encrypted in the browser with `@fhevm/react`, shipped on-chain, and compared in Solidity without ever exposing the raw values.

- **Winner gets paid immediately**  
  Once both moves land, anybody can call `finalizeMatch` to distribute the stakes. Ties trigger an automatic refund—no middleman needed.

- **Follow the drama**  
  The frontend renders a four-step progress bar and an on-chain timeline so spectators can watch the battle unfold in real time.

- **Keep score & rematch**  
  Victories add points to the leaderboard, and both players can reopen a finished room for another encrypted round.

---

## What’s inside this repo?

contracts/ Hardhat project: CipherClashRegistry + CipherClash FHE logic
frontend/ React + Vite app with RainbowKit, wagmi, and FHE hooks
docs/ Architecture notes, deployment steps, testing strategy
scripts/ Environment helpers and a short demo runbook



---

## Quick start (local)

1. **Install dependencies**
   ```bash
   pnpm install --filter contracts
   pnpm install --filter frontend
Compile & test the contracts

bash

cd contracts
pnpm hardhat compile
pnpm hardhat test
Configure & run the frontend

bash

cd ../frontend
cp .env.example .env   # fill in registry + fhEVM addresses once deployed
pnpm run dev
Need more context? Check out the docs:

@docs/overview.md – story, flow, and goals
@docs/architecture.md – how the contracts and hooks fit together
@docs/deployment.md – deploy to Sepolia and host the UI
@docs/testing.md – automated tests plus a manual demo checklist
Submission readiness
Requirement	Status
Original contracts + FHE logic	✅ CipherClashRegistry and CipherClash with encrypted comparisons
Working demo	✅ Local dev ready, Sepolia deployment script provided
Automated tests	✅ pnpm hardhat test, pnpm --filter frontend test
UI/UX polish	✅ Custom theme, progress bar, timeline, leaderboard
Presentation video	🔄 Record a run-through before submitting
License
MIT License – fork it, remix it, and challenge your friends to an encrypted showdown.
