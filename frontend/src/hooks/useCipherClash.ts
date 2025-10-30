import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { usePublicClient, useWriteContract } from "wagmi";

import { contractAddresses } from "../contracts/addresses";
import { cipherClashAbi } from "../contracts/cipherClashAbi";
import { registryAbi } from "../contracts/registryAbi";

export interface MatchSummary {
  roomId: number;
  contractAddress: `0x${string}`;
  stake: string;
  stakeWei: bigint;
  playerA: `0x${string}`;
  playerB?: `0x${string}`;
  completed: boolean;
  rankingEnabled: boolean;
  moveASubmitted: boolean;
  moveBSubmitted: boolean;
  stateCode: number;
  winner?: `0x${string}`;
  lastResultPlaintext: number;
  history: MatchHistoryEntry[];
}

export type MatchHistoryEntry = {
  type: "move" | "resolved" | "failed" | "rematch";
  label: string;
  description: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
};

export function useCipherClash() {
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const registry = useMemo(() => contractAddresses.registry, []);

  const refreshMatches = useCallback(async () => {
    if (!client || registry === "0x0000000000000000000000000000000000000000") {
      return;
    }
    setLoadingMatches(true);
    try {
      const counter = (await client.readContract({
        address: registry,
        abi: registryAbi,
        functionName: "roomCounter"
      })) as bigint;

      const total = Number(counter);
      if (total === 0) {
        setMatches([]);
        return;
      }

      const summaries: MatchSummary[] = [];
      const latestBlock = client ? await client.getBlockNumber() : undefined;
      const fromBlock =
        latestBlock && latestBlock > 500000n ? latestBlock - 500000n : 0n;
      for (let id = 1; id <= total; id++) {
        const roomRaw = await client.readContract({
          address: registry,
          abi: registryAbi,
          functionName: "rooms",
          args: [BigInt(id)]
        });

        if (!roomRaw) {
          continue;
        }

        const room = roomRaw as unknown as {
          contractAddress: `0x${string}`;
          playerA: `0x${string}`;
          playerB: `0x${string}`;
          stake: bigint;
          rankingEnabled: boolean;
          completed: boolean;
          [key: number]: unknown;
        };

        const contractAddress = room.contractAddress ?? (room[0] as `0x${string}`);
        const playerA = room.playerA ?? (room[1] as `0x${string}`);
        const playerB = room.playerB ?? (room[2] as `0x${string}`);
        const stakeValue = room.stake ?? (room[3] as bigint | undefined);
        const rankingEnabled = room.rankingEnabled ?? (room[4] as boolean | undefined);
        const completed = room.completed ?? (room[5] as boolean | undefined);

        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
          continue;
        }
        if (!stakeValue) {
          continue;
        }

        const stakeWei = BigInt(stakeValue.toString());

        const detailResults = client
          ? await client.multicall({
              allowFailure: false,
              contracts: [
                {
                  address: contractAddress,
                  abi: cipherClashAbi,
                  functionName: "moveASubmitted"
                } as const,
                {
                  address: contractAddress,
                  abi: cipherClashAbi,
                  functionName: "moveBSubmitted"
                } as const,
                {
                  address: contractAddress,
                  abi: cipherClashAbi,
                  functionName: "state"
                } as const,
                {
                  address: contractAddress,
                  abi: cipherClashAbi,
                  functionName: "winner"
                } as const,
                {
                  address: contractAddress,
                  abi: cipherClashAbi,
                  functionName: "lastResultPlaintext"
                } as const
              ]
            })
          : undefined;

        const [moveAResult, moveBResult, stateResult, winnerResult, lastResultValue] = detailResults ?? [];

        const moveASubmitted =
          typeof moveAResult === "object" && moveAResult !== null && "result" in moveAResult
            ? Boolean((moveAResult as { result: boolean }).result)
            : Boolean(moveAResult);

        const moveBSubmitted =
          typeof moveBResult === "object" && moveBResult !== null && "result" in moveBResult
            ? Boolean((moveBResult as { result: boolean }).result)
            : Boolean(moveBResult);

        const rawStateValue =
          typeof stateResult === "object" && stateResult !== null && "result" in stateResult
            ? (stateResult as { result: number | bigint }).result
            : stateResult ?? 0;
        const stateCode =
          typeof rawStateValue === "number"
            ? rawStateValue
            : typeof rawStateValue === "bigint"
              ? Number(rawStateValue)
              : 0;

        const rawWinner =
          typeof winnerResult === "object" && winnerResult !== null && "result" in winnerResult
            ? (winnerResult as { result: `0x${string}` }).result
            : (winnerResult as `0x${string}` | undefined);
        const winnerNormalized =
          rawWinner && rawWinner !== "0x0000000000000000000000000000000000000000"
            ? rawWinner
            : undefined;

        const rawLastValue =
          typeof lastResultValue === "object" && lastResultValue !== null && "result" in lastResultValue
            ? (lastResultValue as { result: number | bigint }).result
            : lastResultValue ?? 0;
        const lastResult =
          typeof rawLastValue === "number"
            ? rawLastValue
            : typeof rawLastValue === "bigint"
              ? Number(rawLastValue)
              : 0;

        let history: MatchHistoryEntry[] = [];
        if (client) {
          try {
            const logs = await client.getLogs({
              address: contractAddress,
              abi: cipherClashAbi,
              fromBlock,
              toBlock: latestBlock
            });

            history = logs
              .map((log) => {
                if (!("eventName" in log)) return undefined;
                if (log.eventName === "MoveSubmitted") {
                  const player = (log.args?.player ?? "") as string;
                  return {
                    type: "move",
                    label: "Encrypted move submitted",
                    description: `Player ${truncateAddress(player as `0x${string}`)}`,
                    txHash: log.transactionHash as `0x${string}`,
                    blockNumber: log.blockNumber ?? 0n
                  } satisfies MatchHistoryEntry;
                }
                if (log.eventName === "MatchResolved") {
                  const resultCode = Number(log.args?.resultCode ?? 0);
                  const winnerAddr = (log.args?.winner ?? "") as `0x${string}`;
                  const resultLabel = resultCode === 0 ? "Tie" : resultCode === 1 ? "Host wins" : "Challenger wins";
                  const winnerText =
                    resultCode === 0 || !winnerAddr || winnerAddr === "0x0000000000000000000000000000000000000000"
                      ? ""
                      : ` • Winner ${truncateAddress(winnerAddr)}`;
                  return {
                    type: "resolved",
                    label: "Match resolved",
                    description: `${resultLabel}${winnerText}`,
                    txHash: log.transactionHash as `0x${string}`,
                    blockNumber: log.blockNumber ?? 0n
                  } satisfies MatchHistoryEntry;
                }
                if (log.eventName === "MatchFailed") {
                  const reason = (log.args?.reason ?? "Unknown failure") as string;
                  return {
                    type: "failed",
                    label: "Match failed",
                    description: reason,
                    txHash: log.transactionHash as `0x${string}`,
                    blockNumber: log.blockNumber ?? 0n
                  } satisfies MatchHistoryEntry;
                }
                if (log.eventName === "RematchReady") {
                  return {
                    type: "rematch",
                    label: "Rematch ready",
                    description: "Both players requested a rematch window.",
                    txHash: log.transactionHash as `0x${string}`,
                    blockNumber: log.blockNumber ?? 0n
                  } satisfies MatchHistoryEntry;
                }
                return undefined;
              })
              .filter((entry): entry is MatchHistoryEntry => Boolean(entry))
              .sort((a, b) => Number(a.blockNumber - b.blockNumber));
          } catch (error) {
            console.warn("Failed to fetch match history", error);
          }
        }

        summaries.push({
          roomId: id,
          contractAddress,
          playerA,
          playerB: playerB === "0x0000000000000000000000000000000000000000" ? undefined : playerB,
          stake: `${formatEther(stakeWei)} ETH`,
          stakeWei,
          rankingEnabled: Boolean(rankingEnabled),
          completed: Boolean(completed),
          moveASubmitted,
          moveBSubmitted,
          stateCode,
          winner: winnerNormalized,
          lastResultPlaintext: lastResult,
          history
        });
      }

      setMatches(summaries);
    } finally {
      setLoadingMatches(false);
    }
  }, [client, registry]);

  useEffect(() => {
    void refreshMatches();
  }, [refreshMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshMatches();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshMatches]);

  const createRoom = useCallback(
    async (params: { stake: string; moveTimeout: number; rematchWindow: number; rankingEnabled: boolean }) => {
      if (!writeContractAsync) return;
      const stakeWei = parseEther(params.stake);
      await writeContractAsync({
        abi: registryAbi,
        address: registry,
        functionName: "createRoom",
        args: [stakeWei, params.moveTimeout, params.rematchWindow, params.rankingEnabled],
        value: stakeWei
      });
      await refreshMatches();
    },
    [refreshMatches, registry, writeContractAsync]
  );

  const joinRoom = useCallback(
    async (roomId: number, stakeWei: bigint) => {
      if (!writeContractAsync) return;
      await writeContractAsync({
        abi: registryAbi,
        address: registry,
        functionName: "joinRoom",
        args: [BigInt(roomId)],
        value: stakeWei
      });
      await refreshMatches();
    },
    [refreshMatches, registry, writeContractAsync]
  );

  const finalizeMatch = useCallback(
    async (roomId: number) => {
      if (!writeContractAsync) return;
      await writeContractAsync({
        abi: registryAbi,
        address: registry,
        functionName: "finalizeMatch",
        args: [BigInt(roomId)]
      });
      await refreshMatches();
    },
    [refreshMatches, registry, writeContractAsync]
  );

  const submitMove = useCallback(
    async (payload: { contractAddress: `0x${string}`; encryptedMove: `0x${string}`; inputProof: `0x${string}` }) => {
      if (!writeContractAsync) return;
      await writeContractAsync({
        abi: cipherClashAbi,
        address: payload.contractAddress,
        functionName: "submitMove",
        args: [payload.encryptedMove, payload.inputProof]
      });
      await refreshMatches();
    },
    [refreshMatches, writeContractAsync]
  );

  return {
    matches,
    loadingMatches,
    refreshMatches,
    createRoom,
    joinRoom,
    finalizeMatch,
    submitMove
  };
}

function truncateAddress(address?: `0x${string}`): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
