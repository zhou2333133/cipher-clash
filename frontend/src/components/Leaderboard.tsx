import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

import { contractAddresses } from "../contracts/addresses";
import { registryAbi } from "../contracts/registryAbi";

interface LeaderboardRow {
  player: `0x${string}`;
  points: bigint;
  wins: number;
  losses: number;
  ties: number;
}

export function Leaderboard() {
  const client = usePublicClient();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!client || contractAddresses.registry === "0x0000000000000000000000000000000000000000") {
        return;
      }
      const result = (await client.readContract({
        address: contractAddresses.registry,
        abi: registryAbi,
        functionName: "getLeaderboard",
        args: [BigInt(5)]
      })) as LeaderboardRow[];
      setRows(result);
    };

    void fetchLeaderboard();
  }, [client]);

  return (
    <section className="rounded-2xl border border-slate-200/15 bg-[#101d2f]/80 p-4 shadow-lg shadow-black/20">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Leaderboard</h3>
        <span className="text-xs text-slate-300/60">Top 5</span>
      </header>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-200/70">No players yet.</p>}
        {rows.map((row, index) => (
          <div
            key={row.player}
            className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200/80"
          >
            <div>
              <span className="mr-3 text-xs text-slate-300/60">#{index + 1}</span>
              <span className="font-mono text-xs">{row.player}</span>
            </div>
            <div className="text-right text-xs text-slate-300/70">
              <div className="font-semibold text-amber-300">{row.points.toString()} pts</div>
              <div className="text-[11px] text-slate-300/60">
                {row.wins} W / {row.losses} L / {row.ties} T
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
