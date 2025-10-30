import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { MatchCard } from "../components/MatchCard";
import type { MatchSummary } from "../hooks/useCipherClash";

vi.mock("../hooks/useEncryptedMove", () => ({
  useEncryptedMove: () => ({
    encryptMove: vi.fn(),
    isEncrypting: false,
    encryptionError: null,
    status: "ready",
    isReady: true
  })
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x50bC537C3447A70de8427Fde0Ddee2c27d6db3B1" })
}));

const baseMatch: MatchSummary = {
  roomId: 42,
  contractAddress: "0x0000000000000000000000000000000000000042",
  stake: "0.00001 ETH",
  stakeWei: 10n ** 13n,
  playerA: "0x50bC537C3447A70de8427Fde0Ddee2c27d6db3B1",
  playerB: "0x206b7120C63FEaF41d833f610F69CF31c9C8EC06",
  completed: false,
  rankingEnabled: true,
  moveASubmitted: true,
  moveBSubmitted: false,
  stateCode: 1,
  winner: undefined,
  lastResultPlaintext: 0,
  history: []
};

describe("MatchCard", () => {
  it("renders match status and timeline entries", () => {
    const data: MatchSummary = {
      ...baseMatch,
      moveBSubmitted: true,
      stateCode: 3,
      completed: true,
      history: [
        {
          type: "move",
          label: "Encrypted move submitted",
          description: "Player 1",
          txHash: "0x1234",
          blockNumber: 1n
        },
        {
          type: "resolved",
          label: "Match resolved",
          description: "Host wins • Winner 0x50bC...b3B1",
          txHash: "0x4567",
          blockNumber: 2n
        }
      ]
    };

    render(<MatchCard data={data} />);

    expect(screen.getByText("Match status: Resolved")).toBeInTheDocument();
    expect(screen.getByText("Encrypted move submitted")).toBeInTheDocument();
    expect(screen.getByText(/Rewards are sent automatically/)).toBeInTheDocument();
  });

  it("prompts participant to submit when opponent has already played", () => {
    const data: MatchSummary = {
      ...baseMatch,
      moveASubmitted: false,
      moveBSubmitted: true,
      stateCode: 1,
      history: []
    };

    render(<MatchCard data={data} />);

    expect(
      screen.getByText("Opponent already submitted. Please choose a move to stay in the game.")
    ).toBeInTheDocument();
  });
});
