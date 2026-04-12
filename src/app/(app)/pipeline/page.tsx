"use client";

import { useState } from "react";
import { Play, RefreshCw, Target, Eye, SkipForward } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { KanbanColumn } from "./_components/kanban-column";

export type ScoredItem = RouterOutputs["workflow"]["getPipeline"]["pursue"][number];

export default function PipelinePage() {
  const [runLog, setRunLog] = useState<string | null>(null);

  const pipeline = api.workflow.getPipeline.useQuery();
  const runPipeline = api.workflow.runPipeline.useMutation({
    onSuccess: () => {
      setRunLog("Pipeline started — scoring opportunities in the background...");
      // Poll for updates
      setTimeout(() => void pipeline.refetch(), 5000);
      setTimeout(() => void pipeline.refetch(), 15000);
      setTimeout(() => void pipeline.refetch(), 30000);
    },
    onError: (err) => setRunLog(`Error: ${err.message}`),
  });

  const pursue = pipeline.data?.pursue ?? [];
  const watch = pipeline.data?.watch ?? [];
  const skip = pipeline.data?.skip ?? [];
  const total = pursue.length + watch.length + skip.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Opportunity Pipeline</h2>
          {total > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{total} scored</span>
              <span className="text-emerald-600">{pursue.length} pursue</span>
              <span className="text-amber-600">{watch.length} watch</span>
              <span className="text-muted-foreground/60">{skip.length} skip</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void pipeline.refetch()}
            disabled={pipeline.isFetching}
          >
            <RefreshCw className={`size-3.5 ${pipeline.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setRunLog(null);
              runPipeline.mutate();
            }}
            disabled={runPipeline.isPending}
          >
            {runPipeline.isPending ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Run Pipeline
          </Button>
        </div>
      </div>

      {runLog && (
        <div className="rounded-lg border bg-muted px-4 py-3">
          <p className="text-sm font-mono text-muted-foreground">{runLog}</p>
        </div>
      )}

      {/* Kanban columns */}
      {total === 0 && !pipeline.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No scored opportunities yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Run the pipeline to score opportunities against your profile
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <KanbanColumn
            title="Pursue"
            icon={<Target className="size-4 text-emerald-600" />}
            items={pursue}
            color="emerald"
          />
          <KanbanColumn
            title="Watch"
            icon={<Eye className="size-4 text-amber-600" />}
            items={watch}
            color="amber"
          />
          <KanbanColumn
            title="Skip"
            icon={<SkipForward className="size-4 text-muted-foreground" />}
            items={skip}
            color="gray"
          />
        </div>
      )}
    </div>
  );
}
