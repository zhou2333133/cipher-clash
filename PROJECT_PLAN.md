# CipherClash Project Plan

## Vision
Deliver a builder-track ready fhEVM dApp that proves encrypted gameplay is practical, documented, and demo-friendly.

## Milestones
1. **M1 – Foundations**: contract scaffolding, fhEVM config, minimal frontend layout.
2. **M2 – FHE Core**: encrypted move submission, on-chain resolution, timeout handling.
3. **M3 – UX Enhancements**: progress bar, timeline, leaderboard, rematch flow.
4. **M4 – Delivery**: documentation, automated tests, deployment scripts, demo video.

## Completed Work
- Contracts compile and pass unit tests; force-resolve and finalize scenarios covered.
- React frontend integrates RainbowKit + wagmi, renders status cards, and shows on-chain history.
- Documentation (overview, architecture, deployment, testing) rewritten in English.
- Runbook prepared for demo recording.

## Outstanding Before Submission
- Deploy latest contracts to Sepolia (record addresses).
- Configure and host the frontend (e.g., Vercel) with correct environment variables.
- Capture a short demo video and link it in the README or submission form.

## Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Relayer throttling | Provide fallback proxy instructions; stagger demo transactions |
| fhEVM init hiccups | Frontend caches instances and surfaces clearer error messages |
| Reviewer friction | Supply step-by-step docs, test commands, and contact info |

## Next Steps
1. Perform a dry-run demo using the latest build.
2. Gather screenshots or GIFs for marketing/README.
3. Package submission (source repo, deployed URL, video link).
