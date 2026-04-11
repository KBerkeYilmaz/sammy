import { HydrateClient } from "~/trpc/server";
import { OpportunityExplorer } from "./_components/opportunity-explorer";

export const metadata = {
  title: "Intel Feed — SCOUT",
  description: "Browse and filter federal contract opportunities from SAM.gov",
};

export default function ExplorePage() {
  return (
    <HydrateClient>
      <div className="flex flex-col flex-1 min-h-0 min-h-0">
        {/* Page header */}
        <div className="border-b border-border bg-[oklch(0.09_0.008_250)] px-6 py-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-[oklch(0.78_0.14_68)]" />
                <h1
                  className="text-lg font-bold tracking-[0.15em] uppercase text-foreground"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  INTEL FEED
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider"
                  style={{
                    background: "oklch(0.78 0.14 68 / 0.10)",
                    color: "oklch(0.78 0.14 68)",
                    border: "1px solid oklch(0.78 0.14 68 / 0.25)",
                  }}>
                  SAM.GOV
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground tracking-wider">
                Federal contract opportunities — click any row for full details
              </p>
            </div>
          </div>
        </div>

        {/* Explorer fills remaining vertical space */}
        <OpportunityExplorer />
      </div>
    </HydrateClient>
  );
}
