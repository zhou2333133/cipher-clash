import { useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { useEncryptedMove } from "../hooks/useEncryptedMove";
import type { MatchSummary } from "../hooks/useCipherClash";

interface MatchCardProps {
  data: MatchSummary;
  onJoin?: (roomId: number, stakeWei: bigint) => Promise<void>;
  onFinalize?: (roomId: number) => Promise<void>;
  onSubmitMove?: (payload: {
    contractAddress: `0x${string}`;
    encryptedMove: `0x${string}`;
    inputProof: `0x${string}`;
  }) => Promise<void>;
}

const MOVE_OPTIONS = [
  { value: 0, label: "Rock" },
  { value: 1, label: "Scissors" },
  { value: 2, label: "Paper" }
] as const;

const PROGRESS_STEPS = [
  { label: "Lobby", description: "Room created" },
  { label: "Match-up", description: "Opponent joins" },
  { label: "Locked moves", description: "Encrypted hands submitted" },
  { label: "Reveal", description: "FHE outcome ready" }
] as const;

export function MatchCard({ data, onJoin, onFinalize, onSubmitMove }: MatchCardProps) {
  const { address } = useAccount();
  const { encryptMove, isEncrypting, encryptionError, isReady, status } = useEncryptedMove();

  const [busy, setBusy] = useState(false);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [submittingMove, setSubmittingMove] = useState(false);

  const isParticipant = useMemo(() => {
    if (!address) return false;
    const normalized = address.toLowerCase();
    return (
      normalized === data.playerA.toLowerCase() ||
      (data.playerB ? normalized === data.playerB.toLowerCase() : false)
    );
  }, [address, data.playerA, data.playerB]);

  const isPlayerA = useMemo(() => {
    if (!address) return false;
    return address.toLowerCase() === data.playerA.toLowerCase();
  }, [address, data.playerA]);

  const participantHasSubmitted = useMemo(() => {
    if (!isParticipant) return false;
    return isPlayerA ? data.moveASubmitted : data.moveBSubmitted;
  }, [data.moveASubmitted, data.moveBSubmitted, isParticipant, isPlayerA]);

  const opponentHasSubmitted = useMemo(() => {
    if (!isParticipant) return false;
    return isPlayerA ? data.moveBSubmitted : data.moveASubmitted;
  }, [data.moveASubmitted, data.moveBSubmitted, isParticipant, isPlayerA]);

  const stateLabel = useMemo(() => {
    const labels = [
      "Waiting for opponent",
      "Awaiting moves",
      "Moves submitted",
      "Resolved",
      "Completed"
    ];
    return labels[data.stateCode] ?? "Unknown";
  }, [data.stateCode]);

  const currentStep = useMemo(() => {
    if (data.stateCode >= 3) return 3;
    if (data.moveASubmitted && data.moveBSubmitted) return 2;
    if (data.playerB) return 1;
    return 0;
  }, [data.stateCode, data.moveASubmitted, data.moveBSubmitted, data.playerB]);

  const resultLabel = useMemo(() => {
    if (data.stateCode < 3) return undefined;
    const labels = ["Tie", "Host wins", "Challenger wins"];
    const label = labels[data.lastResultPlaintext] ?? "Unknown result";
    if (!data.winner) {
      return label;
    }
    const shortWinner = `${data.winner.slice(0, 6)}...${data.winner.slice(-4)}`;
    if (data.lastResultPlaintext === 0) {
      return label;
    }
    return `${label} (${shortWinner})`;
  }, [data.lastResultPlaintext, data.stateCode, data.winner]);

  const persistedStatusMessage = useMemo(() => {
    if (!isParticipant) {
      if (data.stateCode >= 3) {
        return resultLabel ? `Match resolved: ${resultLabel}` : "Match resolved.";
      }
      return undefined;
    }

    if (data.stateCode >= 3) {
      const base = resultLabel ? `Match resolved: ${resultLabel}` : "Match resolved.";
      return `${base} Rewards have already been distributed on-chain.`;
    }

    if (participantHasSubmitted) {
      return opponentHasSubmitted
        ? "Both encrypted moves submitted. Awaiting on-chain resolution."
        : "Your encrypted move is on-chain. Waiting for opponent.";
    }

    if (opponentHasSubmitted) {
      return "Opponent already submitted. Please choose a move to stay in the game.";
    }

    return "Select your hand and submit before the timer expires.";
  }, [data.stateCode, opponentHasSubmitted, participantHasSubmitted, resultLabel, isParticipant]);

  const handleJoin = async () => {
    if (!onJoin) return;
    setBusy(true);
    setTxMessage("Submitting join transaction...");
    setTxError(null);
    try {
      await onJoin(data.roomId, data.stakeWei);
      setTxMessage("Joined successfully. Waiting for an opponent move.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Join transaction failed.";
      setTxError(message);
      setTxMessage(null);
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (!onFinalize) return;
    setBusy(true);
    setTxMessage("Submitting finalize & payout transaction...");
    setTxError(null);
    try {
      await onFinalize(data.roomId);
      setTxMessage("Finalize confirmed. Rewards have been distributed.");
    } catch (error) {
      const message =
        error instanceof Error && /denied/i.test(error.message)
          ? "Finalize signature was rejected."
          : error instanceof Error
            ? error.message
            : "Finalize failed. Please retry.";
      setTxError(message);
      setTxMessage(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitMove = async () => {
    if (!onSubmitMove || !address) return;
    if (!isParticipant) {
      setTxError("Only players in this match can submit a move.");
      return;
    }
    if (selectedMove === null) {
      setTxError("Please select a hand before submitting.");
      return;
    }
    if (!isReady) {
      setTxError("FHE instance is still loading. Please wait and try again.");
      return;
    }

    setSubmittingMove(true);
    setTxMessage("Encrypting and submitting move...");
    setTxError(null);
    try {
      const encrypted = await encryptMove(selectedMove, data.contractAddress, address);
      await onSubmitMove({
        contractAddress: data.contractAddress,
        encryptedMove: encrypted.encryptedData as `0x${string}`,
        inputProof: encrypted.inputProof as `0x${string}`
      });
      setTxMessage("Move submitted. Waiting for opponent.");
      setSelectedMove(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submitting move failed.";
      setTxError(message);
      setTxMessage(null);
    } finally {
      setSubmittingMove(false);
    }
  };

  const history = data.history;

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-slate-200/15 bg-[#101d2f]/75 p-5 shadow-lg shadow-black/20 backdrop-blur-sm">
      <header className="flex items-center justify-between text-sm text-slate-200/80">
        <span className="font-medium text-white">Room #{data.roomId}</span>
        <span className="rounded-full border border-slate-200/30 px-3 py-1 text-xs uppercase tracking-wide text-slate-200/70">
          {data.completed ? "Finished" : data.playerB ? "In progress" : "Waiting"}
        </span>
      </header>

      <div className="flex items-center justify-between gap-2">
        {PROGRESS_STEPS.map((step, index) => {
          const isActive = index <= currentStep;
          const isLast = index === PROGRESS_STEPS.length - 1;
          return (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isActive ? "bg-amber-400 text-slate-900" : "bg-slate-700/40 text-slate-300/60"
                  }`}
                >
                  {index + 1}
                </div>
                <p className={`mt-1 text-xs ${isActive ? "text-slate-100" : "text-slate-300/60"}`}>{step.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-300/50">{step.description}</p>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition ${
                    index < currentStep ? "bg-amber-400/80" : "bg-slate-600/40"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm text-slate-200/80">
        <div>
          <dt className="text-slate-300/60">Host</dt>
          <dd className="truncate font-mono text-xs">{data.playerA}</dd>
        </div>
        <div>
          <dt className="text-slate-300/60">Challenger</dt>
          <dd className="truncate font-mono text-xs">{data.playerB ?? "Pending"}</dd>
        </div>
        <div>
          <dt className="text-slate-300/60">Stake</dt>
          <dd className="font-semibold text-amber-300">{data.stake}</dd>
        </div>
        <div>
          <dt className="text-slate-300/60">Ranking</dt>
          <dd>{data.rankingEnabled ? "Enabled" : "Off"}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-4 text-sm">
        {!data.playerB && !isPlayerA && (
          <button
            type="button"
            disabled={busy}
            onClick={handleJoin}
            className="rounded-lg bg-emerald-400 px-3 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-400/30 disabled:text-slate-200"
          >
            {busy ? "Joining..." : "Join Room"}
          </button>
        )}
        {!data.playerB && isPlayerA && (
          <p className="rounded-lg border border-dashed border-slate-200/30 bg-slate-900/30 px-3 py-2 text-xs text-slate-200/70">
            You created this room. Share it with a challenger or open a second wallet to join from another address.
          </p>
        )}

        {data.playerB && !data.completed && onSubmitMove && (
          <div className="space-y-2">
            <div className="text-xs text-slate-200/70">
              {isParticipant ? (
                <p>
                  {isReady
                    ? "Select your hand and submit the encrypted move."
                    : status === "error"
                      ? "FHE session failed to initialise. Please refresh the page and try again."
                      : `Initialising FHE session... (${status ?? "loading"})`}
                </p>
              ) : (
                <p>Only participants can submit moves.</p>
              )}
            </div>
            <div className="flex gap-2">
              {MOVE_OPTIONS.map((option) => {
                const isSelected = selectedMove === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!isParticipant || submittingMove || isEncrypting}
                    onClick={() => setSelectedMove(option.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-amber-300/80 bg-amber-300/20"
                        : "border-slate-200/20 hover:border-amber-200/60 hover:bg-amber-200/10"
                    } disabled:cursor-not-allowed disabled:border-slate-200/10`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!isParticipant || submittingMove || isEncrypting || !isReady || selectedMove === null}
              onClick={handleSubmitMove}
              className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-400/30 disabled:text-slate-200"
            >
              {submittingMove || isEncrypting ? "Submitting..." : "Submit Encrypted Move"}
            </button>
          </div>
        )}

        <div className="grid gap-1 rounded-lg border border-slate-200/15 bg-slate-900/40 p-3 text-xs text-slate-200/70">
          <p className="font-semibold text-white">Match status: {stateLabel}</p>
          <p>Host move submitted: {data.moveASubmitted ? "Yes" : "No"}</p>
          <p>Challenger move submitted: {data.moveBSubmitted ? "Yes" : "No"}</p>
          {resultLabel && <p>Result: {resultLabel}</p>}
          {data.stateCode >= 3 && (
            <p className="text-emerald-300">Rewards are sent automatically when someone finalizes the match.</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200/15 bg-slate-900/30 p-3 text-xs text-slate-300/80">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">On-chain timeline</p>
            <span className="text-[10px] uppercase tracking-wide text-slate-300/60">
              {history.length} event{history.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="space-y-2">
            {history.length === 0 && <li className="text-slate-300/60">No on-chain activity yet.</li>}
            {history.map((item) => (
              <li
                key={`${item.txHash}-${item.blockNumber}-${item.label}`}
                className="flex items-start gap-2 rounded-md bg-slate-800/40 px-3 py-2"
              >
                <span
                  className={`mt-0.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    item.type === "move"
                      ? "bg-amber-300"
                      : item.type === "resolved"
                        ? "bg-emerald-300"
                        : item.type === "failed"
                          ? "bg-rose-400"
                          : "bg-sky-300"
                  }`}
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-100">{item.label}</p>
                  <p className="text-[11px] text-slate-300/70">{item.description}</p>
                  <p className="text-[10px] text-slate-400/60">
                    Block {Number(item.blockNumber)} •{" "}
                    <a
                      href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 hover:underline"
                    >
                      View tx
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {data.playerB && !data.completed && (
          <button
            type="button"
            disabled={busy}
            onClick={handleFinalize}
            className="rounded-lg border border-slate-200/20 px-3 py-2 font-semibold transition hover:border-amber-300/60 hover:bg-amber-200/10 disabled:cursor-not-allowed disabled:border-slate-200/10"
          >
            {busy ? "Sending..." : "Finalize & Payout"}
          </button>
        )}

        {(txMessage || txError || encryptionError) && (
          <div className="space-y-1 text-xs">
            {txMessage && <p className="text-emerald-400">{txMessage}</p>}
            {(txError || encryptionError) && <p className="text-rose-400">{txError ?? encryptionError}</p>}
          </div>
        )}

        {!txMessage && !txError && !encryptionError && persistedStatusMessage && (
          <p className="text-xs text-slate-200/70">{persistedStatusMessage}</p>
        )}
      </div>
    </article>
  );
}
