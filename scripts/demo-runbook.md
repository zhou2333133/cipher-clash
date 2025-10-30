# Demo Runbook

Use this checklist when recording or presenting the CipherClash demo.

## Setup
- Two wallets with Sepolia ETH (host + challenger).
- Deployed registry address and frontend configured with correct `.env` values.
- Screen recording software or live streaming tool.

## Suggested Flow (~3 minutes)
1. **Intro (30s)** – explain encrypted gameplay and instant settlement.
2. **Create room (40s)** – wallet A stakes 0.00001 ETH, highlight the new card.
3. **Join room (30s)** – wallet B joins; status changes to “In progress”.
4. **Submit moves (50s)** – both players choose hands, highlight the timeline entries.
5. **Finalize (40s)** – click “Finalize & Payout”, show the winner banner and leaderboard update.
6. **Optional rematch (30s)** – trigger rematch window to show repeated play.
7. **Wrap-up (20s)** – recap privacy benefits and extensibility.

## Backup Scenarios
- Demonstrate `forceResolve` if one player stalls.
- Show a tie and the refund logic.
- Browse Etherscan events to reinforce transparency.

## Tips
- Confirm relayer health and wallet network before recording.
- Pre-fund wallets to avoid pauses.
- Keep video resolution high enough for reviewers to read text.
