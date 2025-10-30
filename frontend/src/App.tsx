import { FormEvent, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";

import { contractAddresses } from "./contracts/addresses";
import { registryAbi } from "./contracts/registryAbi";
import { Leaderboard } from "./components/Leaderboard";
import { MatchCard } from "./components/MatchCard";
import { useCipherClash } from "./hooks/useCipherClash";

function App() {
  const { address } = useAccount();
  const { matches, loadingMatches, refreshMatches, createRoom, joinRoom, finalizeMatch, submitMove } = useCipherClash();
  const [roomCount, setRoomCount] = useState<number>(0);
  const [formState, setFormState] = useState({
    stake: "0.01",
    moveTimeout: 90,
    rematchWindow: 180,
    rankingEnabled: true
  });
  const [formPending, setFormPending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: counter } = useReadContract({
    abi: registryAbi,
    address: contractAddresses.registry,
    functionName: "roomCounter"
  });

  useEffect(() => {
    if (counter) {
      setRoomCount(Number(counter));
    }
  }, [counter]);

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormPending(true);
    setFormMessage("Submitting create-room transaction...");
    setFormError(null);
    try {
      await createRoom(formState);
      setFormMessage("Transaction sent. The lobby will update once the block is confirmed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create room transaction failed.";
      setFormError(message);
      setFormMessage(null);
    } finally {
      setFormPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1726] via-[#132235] to-[#1f2f46] text-white">
      <header className="border-b border-white/5 bg-[#0b1522]/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide">CipherClash</h1>
            <p className="text-sm text-slate-200/70">FHE-powered private Rock Paper Scissors</p>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-6 flex flex-col gap-6 rounded-2xl border border-white/5 bg-[#101d2f]/80 p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Match Lobby</h2>
                <p className="text-sm text-slate-200/70">Currently tracking {roomCount} room(s). Create or join to start playing.</p>
              </div>
              <button
                type="button"
                onClick={refreshMatches}
                className="rounded-full border border-slate-300/30 px-4 py-2 text-sm transition hover:border-slate-200/60 hover:bg-slate-200/10"
              >
                Refresh
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreateRoom}>
              <div className="md:col-span-1">
                <label className="block text-xs uppercase text-slate-300/60">Stake (ETH)</label>
                <input
                  type="number"
                  min="0.00001"
                  step="0.00001"
                  value={formState.stake}
                  onChange={(e) => setFormState((prev) => ({ ...prev, stake: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200/20 bg-[#0c1624] px-3 py-2 text-sm focus:border-slate-200/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-300/60">Move timeout (sec)</label>
                <input
                  type="number"
                  min="30"
                  value={formState.moveTimeout}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, moveTimeout: Number.parseInt(e.target.value, 10) }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200/20 bg-[#0c1624] px-3 py-2 text-sm focus:border-slate-200/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-300/60">Rematch window (sec)</label>
                <input
                  type="number"
                  min="60"
                  value={formState.rematchWindow}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, rematchWindow: Number.parseInt(e.target.value, 10) }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200/20 bg-[#0c1624] px-3 py-2 text-sm focus:border-slate-200/60 focus:outline-none"
                />
              </div>
              <div className="flex flex-col justify-end md:col-span-1">
                <label className="mb-2 inline-flex items-center text-sm text-slate-200/80">
                  <input
                    type="checkbox"
                    checked={formState.rankingEnabled}
                    onChange={(e) => setFormState((prev) => ({ ...prev, rankingEnabled: e.target.checked }))}
                    className="mr-2"
                  />
                  Include in leaderboard
                </label>
                <button
                  type="submit"
                  disabled={!address || formPending}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300/30 disabled:text-slate-200"
                >
                  {formPending ? "Submitting..." : "Create Room"}
                </button>
              </div>
            </form>

            {(formMessage || formError) && (
              <div className="rounded-lg border border-slate-300/20 bg-[#0f1c2d]/80 px-4 py-2 text-xs">
                {formMessage && <p className="text-emerald-300">{formMessage}</p>}
                {formError && <p className="text-rose-400">{formError}</p>}
              </div>
            )}
          </div>

          {loadingMatches && <p className="mt-4 text-sm text-slate-200/70">Fetching latest rooms...</p>}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard
                key={match.roomId}
                data={match}
                onJoin={joinRoom}
                onFinalize={finalizeMatch}
                onSubmitMove={submitMove}
              />
            ))}
            {!loadingMatches && matches.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200/30 bg-[#0f1c2d]/70 p-6 text-center text-slate-200/70">
                No active rooms yet. Be the first to create one!
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Leaderboard />
          <section className="rounded-2xl border border-white/5 bg-[#101d2f]/80 p-4 text-sm leading-relaxed text-slate-200/80 shadow-lg shadow-black/20">
            <h3 className="mb-2 text-base font-semibold text-white">How to play</h3>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Create or join a room, staking the entry amount.</li>
              <li>Select your hand and submit the encrypted move.</li>
              <li>FHE decides the winner privately, only revealing the outcome.</li>
              <li>Trigger rematches to accumulate points and climb the leaderboard.</li>
            </ol>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
