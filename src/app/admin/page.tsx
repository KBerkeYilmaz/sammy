"use client";

import { useState } from "react";
import { Database, Layers, RefreshCw, Terminal } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function AdminPage() {
  const [postedFrom, setPostedFrom] = useState("01/01/2025");
  const [postedTo, setPostedTo] = useState("04/11/2025");
  const [limit, setLimit] = useState(1000);
  const [log, setLog] = useState<string | null>(null);

  const stats = api.ingest.stats.useQuery();
  const trigger = api.ingest.trigger.useMutation({
    onSuccess: (data) => {
      setLog(
        `Done \u2014 fetched ${data.fetched} of ${data.totalAvailable} total. ` +
          `Upserted: ${data.upserted}, Embedded: ${data.embedded}, Skipped: ${data.skipped}`,
      );
      void stats.refetch();
    },
    onError: (err) => setLog(`Error: ${err.message}`),
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold">Admin</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">
          {/* Stats */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Database Statistics
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Database className="size-4 text-primary" />}
                label="Opportunities"
                value={stats.data?.opportunityCount ?? null}
              />
              <StatCard
                icon={<Layers className="size-4 text-primary" />}
                label="Chunks"
                value={stats.data?.chunkCount ?? null}
              />
              <StatCard
                icon={<RefreshCw className="size-4 text-primary" />}
                label="Last Sync"
                value={
                  stats.data?.lastSync
                    ? new Date(stats.data.lastSync).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null
                }
                isText
              />
            </div>
          </section>

          {/* Ingestion */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Trigger Ingestion
            </h2>
            <div className="rounded-lg border p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    From (MM/DD/YYYY)
                  </label>
                  <Input
                    value={postedFrom}
                    onChange={(e) => setPostedFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    To (MM/DD/YYYY)
                  </label>
                  <Input
                    value={postedTo}
                    onChange={(e) => setPostedTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Limit
                  </label>
                  <Input
                    type="number"
                    value={String(limit)}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    min={1}
                    max={1000}
                  />
                </div>
              </div>

              <Button
                disabled={trigger.isPending}
                onClick={() => {
                  setLog(null);
                  trigger.mutate({ postedFrom, postedTo, limit });
                }}
              >
                {trigger.isPending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <Terminal className="size-4" />
                    Run Ingestion
                  </>
                )}
              </Button>

              {log && (
                <div className="rounded-lg border bg-muted px-4 py-3">
                  <p className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                    {log}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Warning */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
            SAM.gov API rate limit is <span className="font-medium text-foreground">10 req/day</span>.
            Batch and cache aggressively. Never query live during demos.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={`font-semibold ${isText ? "text-sm text-muted-foreground" : "text-2xl"}`}>
        {value === null ? (
          <span className="text-muted-foreground/30">\u2014</span>
        ) : typeof value === "number" ? (
          value.toLocaleString()
        ) : (
          value
        )}
      </div>
    </div>
  );
}
