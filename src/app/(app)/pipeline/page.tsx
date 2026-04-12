"use client";

import { useState } from "react";
import { Play, RefreshCw, Target, Eye, SkipForward } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

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

type ScoredItem = {
  id: string;
  fitScore: number;
  recommendation: string;
  rationale: string;
  keyStrengths: unknown;
  risks: unknown;
  opportunity: {
    title: string;
    department: string;
    naicsCode: string | null;
    type: string;
    solicitationNumber: string | null;
    responseDeadline: Date | null;
  };
};

function KanbanColumn({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: ScoredItem[];
  color: "emerald" | "amber" | "gray";
}) {
  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20",
    amber: "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
    gray: "border-border bg-muted/30",
  };

  return (
    <div className={`rounded-lg border ${colorMap[color]} p-3`}>
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {items.map((item) => (
          <OpportunityCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({ item }: { item: ScoredItem }) {
  const [expanded, setExpanded] = useState(false);
  const deadline = item.opportunity.responseDeadline
    ? new Date(item.opportunity.responseDeadline)
    : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (86400000))
    : null;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full rounded-lg border bg-background p-3 text-left transition-all hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {item.opportunity.title}
        </p>
        <Badge
          variant={item.fitScore >= 80 ? "default" : "secondary"}
          className="shrink-0 text-xs"
        >
          {item.fitScore}
        </Badge>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="truncate">{item.opportunity.department}</span>
        {item.opportunity.naicsCode && (
          <>
            <span>&middot;</span>
            <span>{item.opportunity.naicsCode}</span>
          </>
        )}
      </div>
      {deadline && daysLeft !== null && (
        <div className={`mt-1 text-[10px] ${daysLeft <= 7 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"} &middot;{" "}
          {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}
      {expanded && (
        <div className="mt-2 space-y-1.5 border-t pt-2 text-[11px] text-muted-foreground">
          <p>{item.rationale}</p>
          {Array.isArray(item.keyStrengths) && (item.keyStrengths as string[]).length > 0 && (
            <div>
              <span className="font-medium text-emerald-600">Strengths:</span>{" "}
              {(item.keyStrengths as string[]).join(", ")}
            </div>
          )}
          {Array.isArray(item.risks) && (item.risks as string[]).length > 0 && (
            <div>
              <span className="font-medium text-destructive">Risks:</span>{" "}
              {(item.risks as string[]).join(", ")}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
