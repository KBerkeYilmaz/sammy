"use client";

import { useState } from "react";
import { Database, Layers, RefreshCw, Terminal } from "lucide-react";
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
        `DONE — fetched ${data.fetched} of ${data.totalAvailable} total. ` +
          `upserted=${data.upserted} embedded=${data.embedded} skipped=${data.skipped}`,
      );
      void stats.refetch();
    },
    onError: (err) => setLog(`ERR: ${err.message}`),
  });

  return (
    <div className="min-h-[calc(100vh-89px)] bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-[oklch(0.09_0.008_250)] px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 bg-[oklch(0.78_0.14_68)]" />
          <h1
            className="text-lg font-bold tracking-[0.15em] uppercase text-foreground"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            ADMIN
          </h1>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider"
            style={{
              background: "oklch(0.62 0.22 25 / 0.10)",
              color: "oklch(0.62 0.22 25)",
              border: "1px solid oklch(0.62 0.22 25 / 0.25)",
            }}
          >
            RESTRICTED
          </span>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground tracking-wider">
          SAM.gov ingestion · database statistics · pipeline controls
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* ── Stats grid ──────────────────────────────────── */}
        <div>
          <SectionLabel>Database Statistics</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Database className="size-4 text-[oklch(0.78_0.14_68)]" />}
              label="Opportunities"
              value={stats.data?.opportunityCount ?? null}
            />
            <StatCard
              icon={<Layers className="size-4 text-[oklch(0.72_0.14_195)]" />}
              label="Chunks"
              value={stats.data?.chunkCount ?? null}
            />
            <StatCard
              icon={<RefreshCw className="size-4 text-[oklch(0.65_0.18_145)]" />}
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
        </div>

        {/* ── Ingestion panel ──────────────────────────────── */}
        <div>
          <SectionLabel>Trigger Ingestion</SectionLabel>
          <div className="border border-border bg-[oklch(0.10_0.007_250)] rounded-[2px]">
            {/* Panel header */}
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <Terminal className="size-3.5 text-muted-foreground" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                sammy.ingest.trigger
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Date range + limit */}
              <div className="grid grid-cols-3 gap-3">
                <MonoField
                  label="From (MM/DD/YYYY)"
                  value={postedFrom}
                  onChange={setPostedFrom}
                />
                <MonoField
                  label="To (MM/DD/YYYY)"
                  value={postedTo}
                  onChange={setPostedTo}
                />
                <MonoField
                  label="Limit"
                  value={String(limit)}
                  onChange={(v) => setLimit(Number(v))}
                  type="number"
                />
              </div>

              {/* Run button */}
              <button
                disabled={trigger.isPending}
                onClick={() => {
                  setLog(null);
                  trigger.mutate({ postedFrom, postedTo, limit });
                }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-[2px] text-sm font-mono font-semibold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: trigger.isPending
                    ? "oklch(0.22 0.008 250)"
                    : "oklch(0.78 0.14 68)",
                  color: trigger.isPending
                    ? "oklch(0.52 0.008 250)"
                    : "oklch(0.09 0.008 250)",
                }}
              >
                {trigger.isPending ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Ingesting…
                  </>
                ) : (
                  <>
                    <Terminal className="size-3.5" />
                    Run Ingestion
                  </>
                )}
              </button>

              {/* Log output */}
              {log && (
                <div className="rounded-[2px] border border-border bg-[oklch(0.09_0.008_250)] px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="size-1.5 rounded-full bg-[oklch(0.72_0.14_195)]" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                      Output
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[oklch(0.72_0.14_195)] leading-relaxed whitespace-pre-wrap">
                    {log}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Warnings ─────────────────────────────────────── */}
        <div className="border border-[oklch(0.78_0.14_68/0.20)] bg-[oklch(0.78_0.14_68/0.04)] rounded-[2px] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="text-[oklch(0.78_0.14_68)] font-mono text-xs mt-0.5">⚠</span>
            <div className="text-[11px] font-mono text-[oklch(0.58_0.008_250)] leading-relaxed">
              SAM.gov API rate limit is{" "}
              <span className="text-[oklch(0.78_0.14_68)]">10 req/day</span>. Batch and cache
              aggressively. Never query live during demos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-3 bg-[oklch(0.78_0.14_68)]" />
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[oklch(0.52_0.008_250)]">
        {children}
      </span>
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
    <div className="border border-border bg-[oklch(0.10_0.007_250)] rounded-[2px] p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={`font-mono font-semibold ${isText ? "text-sm text-muted-foreground" : "text-2xl text-foreground"}`}
      >
        {value === null ? (
          <span className="text-[oklch(0.30_0.008_250)]">—</span>
        ) : isText ? (
          value
        ) : (
          typeof value === "number" ? value.toLocaleString() : value
        )}
      </div>
    </div>
  );
}

function MonoField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-widest text-[oklch(0.38_0.008_250)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-[2px] border border-border bg-[oklch(0.13_0.007_250)] px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[oklch(0.78_0.14_68/0.5)] focus:ring-1 focus:ring-[oklch(0.78_0.14_68/0.2)] transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 1000 : undefined}
      />
    </div>
  );
}
