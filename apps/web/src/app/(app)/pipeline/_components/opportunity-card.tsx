"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import type { ScoredItem } from "../page";

export function OpportunityCard({ item }: { item: ScoredItem }) {
  const [expanded, setExpanded] = useState(false);
  const deadline = item.opportunity.responseDeadline
    ? new Date(item.opportunity.responseDeadline)
    : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / 86400000)
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
        <div
          className={`mt-1 text-[10px] ${daysLeft <= 7 ? "text-destructive font-medium" : "text-muted-foreground"}`}
        >
          {daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"} &middot;{" "}
          {deadline.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}
      {expanded && (
        <div className="mt-2 space-y-1.5 border-t pt-2 text-[11px] text-muted-foreground">
          <p>{item.rationale}</p>
          {Array.isArray(item.keyStrengths) &&
            (item.keyStrengths as string[]).length > 0 && (
              <div>
                <span className="font-medium text-emerald-600">
                  Strengths:
                </span>{" "}
                {(item.keyStrengths as string[]).join(", ")}
              </div>
            )}
          {Array.isArray(item.risks) &&
            (item.risks as string[]).length > 0 && (
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
