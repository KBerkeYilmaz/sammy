"use client";

import { Badge } from "~/components/ui/badge";
import { OpportunityCard } from "./opportunity-card";
import type { ScoredItem } from "../page";

const COLOR_MAP = {
  emerald:
    "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20",
  amber:
    "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
  gray: "border-border bg-muted/30",
} as const;

export function KanbanColumn({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: ScoredItem[];
  color: keyof typeof COLOR_MAP;
}) {
  return (
    <div className={`rounded-lg border ${COLOR_MAP[color]} p-3`}>
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
