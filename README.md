# CipherClash

CipherClash is a fully homomorphic encryption (FHE) powered Rock–Paper–Scissors dApp built on top of the Zama fhEVM protocol.  
It lets players stake funds, submit encrypted moves, and obtain the result on-chain without revealing their choices.

## Key Features

- **Private moves** – every hand (rock, paper, scissors) is encrypted on the client with `@fhevm/react` and verified on-chain with `@fhevm/solidity`.
- **Instant settlement** – once both moves are in, anyone can trigger `finalizeMatch` to pay the winner (or refund on ties).
- **Visual battle flow** – the frontend shows a four-step progress bar and a chain event timeline so spectators can follow each match.
- **Leaderboard & rematch** – victories earn points, and players can reopen a match for a rematch window to continue the rivalry.

## Project Structure

```
contracts/   Hardhat project with CipherClashRegistry and CipherClash contracts
frontend/    React + Vite app (RainbowKit, wagmi, @fhevm/react integration)
docs/        Detailed guides: architecture, deployment, testing
scripts/     Helper scripts (environment bootstrap, demo runbook)
```

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install --filter contracts
   pnpm install --filter frontend
   ```
2. **Compile & test the contracts**
   ```bash
   cd contracts
   pnpm hardhat compile
   pnpm hardhat test
   ```
3. **Configure & run the frontend**
   ```bash
   cd ../frontend
   cp .env.example .env   # fill in registry + fhEVM addresses after deployment
   pnpm run dev
   ```

For deployment, testing, and architecture notes see the documents inside [docs/](docs):

- [`overview.md`](docs/overview.md) – product summary and game flow
- [`architecture.md`](docs/architecture.md) – contract/frontend integration details
- [`deployment.md`](docs/deployment.md) – how to deploy to Sepolia and ship the UI
- [`testing.md`](docs/testing.md) – unit tests, component tests, manual checklist

## Submission Checklist

| Requirement                         | Status |
|------------------------------------|--------|
| Original contracts + FHE logic     | ✅ CipherClashRegistry + CipherClash |
| Working demo                       | ✅ Supports local dev + Sepolia deployment |
| Automated tests                    | ✅ `pnpm hardhat test`, `pnpm --filter frontend test` |
| UI/UX polish                       | ✅ Custom theme, progress bar, timeline, leaderboard |
| Presentation video (recommended)   | 🔄 To be recorded when submitting |

## License

MIT License
