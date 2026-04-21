"use client";

import { History } from "lucide-react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";

export default function HistoryPage() {
  const history = api.pipeline.getRunHistory.useQuery();

  if (history.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading workflow history...
      </div>
    );
  }

  if (!history.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <History className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No workflow runs yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Run the pipeline to start tracking automation history
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 space-y-4">
      <h2 className="text-lg font-semibold">Workflow History</h2>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Processed</th>
              <th className="px-4 py-2.5 font-medium">Results</th>
              <th className="px-4 py-2.5 font-medium">Started</th>
              <th className="px-4 py-2.5 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {history.data.map((run) => {
              const results = run.results as Record<string, number> | null;
              const started = new Date(run.startedAt);
              const completed = run.completedAt ? new Date(run.completedAt) : null;
              const durationMs = completed
                ? completed.getTime() - started.getTime()
                : null;

              return (
                <tr key={run.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">
                      {run.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={
                        run.status === "completed"
                          ? "default"
                          : run.status === "running"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {run.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {run.opportunitiesProcessed}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {results ? (
                      <span>
                        <span className="text-emerald-600">{results.pursue}P</span>{" / "}
                        <span className="text-amber-600">{results.watch}W</span>{" / "}
                        <span>{results.skip}S</span>
                        {results.briefsGenerated ? (
                          <span className="ml-1">/ {results.briefsGenerated} briefs</span>
                        ) : null}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {started.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {durationMs !== null
                      ? durationMs < 1000
                        ? `${durationMs}ms`
                        : `${Math.round(durationMs / 1000)}s`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
