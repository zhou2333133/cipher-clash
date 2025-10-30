# Testing Strategy

CipherClash uses a mix of automated and manual testing to ensure reliability.

## 1. Solidity Unit Tests (Hardhat)
Location: `contracts/test/CipherClash.test.ts`

| Scenario | Coverage |
| --- | --- |
| Room creation & join | Registry stores stakes, emits RoomCreated/RoomJoined |
| FHE resolution path | Storage overrides simulate winner/tie, finalize distributes rewards |
| Stake mismatch | Join reverts with `InvalidStake` |
| Leaderboard update | Points increment after finalize |

Run:
```bash
cd contracts
pnpm hardhat test
```

## 2. Frontend Component Tests (Vitest)
Location: `frontend/src/tests/matchCard.test.tsx`
- Ensures the match card renders status, timeline entries, and guidance text in different states.

Run:
```bash
cd frontend
pnpm test
```

## 3. Manual Checklist
| Step | What to verify |
| --- | --- |
| Create room | UI shows room card, stake deducted, `RoomCreated` visible on Etherscan |
| Join room | Status moves to “In progress”; total stake doubles |
| Submit encrypted moves | Timeline logs `Encrypted move submitted`; opponent cannot see the hand |
| Finalize | Result banner matches chain events; rewards are paid/refunded |
| Request rematch | After both votes, state resets to “Awaiting moves” |

## CI Recommendation
Add two jobs in CI:
1. `pnpm hardhat test`
2. `pnpm --filter frontend test`

For future hardening, consider adding Foundry fuzz tests and Slither static analysis.
