# Project Overview

CipherClash is a privacy-first Rock–Paper–Scissors game that runs on the Zama fhEVM. It demonstrates how fully homomorphic encryption (FHE) can hide user moves while still letting a smart contract compute the winner and transfer funds.

## Game Loop
1. **Create room** – player A stakes an amount and deploys a `CipherClash` instance through the registry.
2. **Join room** – player B deposits the same stake to enter the match.
3. **Submit move** – each player uses the frontend to encrypt rock/paper/scissors and send the ciphertext + proof on-chain.
4. **Resolve** – the contract uses FHE logic to determine the winner; the result is revealed without exposing either move.
5. **Finalize** – anyone can call `finalizeMatch` to distribute stakes or refund on ties.
6. **Rematch (optional)** – both players can request a rematch before the window expires.

## Objectives
- Showcase meaningful usage of `@fhevm/solidity` and `@fhevm/react` in a real dApp.
- Provide a polished, easy-to-demo experience with clear visuals and documentation.
- Deliver reusable tooling for future fhEVM builders (Hardhat deployment, React hooks, testing harness).

## Deliverables in This Repository
- **Smart contracts** – `CipherClashRegistry` orchestrates rooms, stakes, points; `CipherClash` holds the FHE logic and room lifecycle.
- **Frontend** – React + Vite app with RainbowKit, wagmi, and custom UI.
- **Documentation** – architecture explanation, deployment guide, testing plan, and presentation runbook.
- **Automated tests** – Hardhat unit tests and Vitest component tests.

Use this document as the entry point, then dive deeper into the rest of the `docs/` folder for specific tasks.
