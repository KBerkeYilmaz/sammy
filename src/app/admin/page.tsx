"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function AdminPage() {
  const [postedFrom, setPostedFrom] = useState("01/01/2025");
  const [postedTo, setPostedTo] = useState("04/11/2025");
  const [limit, setLimit] = useState(1000);
  const [log, setLog] = useState<string | null>(null);

  const stats = api.ingest.stats.useQuery();
  const trigger = api.ingest.trigger.useMutation({
    onSuccess: (data) => {
      setLog(
        `Done — fetched ${data.fetched} of ${data.totalAvailable} total. ` +
        `Upserted: ${data.upserted} | Embedded: ${data.embedded} | Skipped: ${data.skipped}`
      );
      void stats.refetch();
    },
    onError: (err) => setLog(`Error: ${err.message}`),
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Trigger SAM.gov ingestion and view database stats.
      </p>

      <div className="grid grid-cols-3 gap-4 text-sm mb-8">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Opportunities</p>
          <p className="text-2xl font-bold">{stats.data?.opportunityCount ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Chunks</p>
          <p className="text-2xl font-bold">{stats.data?.chunkCount ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Last Sync</p>
          <p className="text-sm font-medium">
            {stats.data?.lastSync
              ? new Date(stats.data.lastSync).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-medium">Trigger Ingestion</h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">From (MM/DD/YYYY)</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={postedFrom}
              onChange={(e) => setPostedFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To (MM/DD/YYYY)</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={postedTo}
              onChange={(e) => setPostedTo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Limit</label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={1000}
            />
          </div>
        </div>

        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={trigger.isPending}
          onClick={() => {
            setLog(null);
            trigger.mutate({ postedFrom, postedTo, limit });
          }}
        >
          {trigger.isPending ? "Ingesting..." : "Run Ingestion"}
        </button>

        {log && (
          <p className="text-sm rounded bg-muted px-3 py-2">{log}</p>
        )}
      </div>
    </main>
  );
}
