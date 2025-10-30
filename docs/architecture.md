# Architecture & FHE Integration

## Contracts
- **CipherClashRegistry** – deploys rooms, tracks stakes, updates leaderboard, manages rematch votes.
- **CipherClash** – handles encrypted move submission, FHE comparison, timeout resolution, and emits match events.

Key smart-contract patterns:
- Import `@fhevm/solidity/lib/FHE.sol` to convert external ciphertexts (`externalEuint8`) into on-chain `euint8` values.
- Use `FHE.eq`, `FHE.and`, and `FHE.select` to implement the Rock–Paper–Scissors matrix without decrypting moves.
- Call `FHE.makePubliclyDecryptable(resultCode)` so the fhEVM oracle can produce a public result once the match ends.
- Registry finalizes payouts based on `lastResultPlaintext`, and updates player stats (wins/losses/ties/points).

## Frontend
- **Stack** – React + Vite + TypeScript, styled with Tailwind utilities and custom colors.
- **Wallet integration** – RainbowKit + wagmi for connection, chain switching, contract interactions.
- **FHE hook** – `useFhevm` fetches/initializes the fhEVM SDK, caches the instance globally, and respects `.env` overrides.
- **Match hook** – `useCipherClash` reads registry state, performs multicalls against room contracts, and fetches on-chain logs for the timeline.

### UI Highlights
- Match cards include a four-step progress bar (Lobby → Match-up → Locked moves → Reveal).
- Chain event timeline lists `MoveSubmitted`, `MatchResolved`, `MatchFailed`, and `RematchReady` events with Etherscan links.
- Leaderboard panel summarizes top players based on on-chain stats.

## Data Flow
```
Player → encrypts move with @fhevm/react → CipherClash.submitMove →
FHE logic runs on contract → resultCode emitted → registry finalizes payout.
```
The frontend polls/multicalls for state and subscribes to logs to keep the UI synchronized with on-chain activity.

## Environment Variables
- The frontend `.env` controls RPC URL, registry address, relayer, and fhEVM contract endpoints.
- The Hardhat project expects `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and fhEVM helper addresses in `contracts/.env` (not committed).

## Security Notes
- Matches enforce a move timeout; an honest participant can call `forceResolve` if the opponent stalls.
- Finalize is permissionless to avoid griefing.
- For production, consider multi-relayer fallback and additional rate limiting on the frontend.
