"use client";

import { Trash2, Power, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface WorkflowListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WorkflowList({ selectedId, onSelect }: WorkflowListProps) {
  const utils = api.useUtils();
  const { data: workflows, isLoading } = api.workflows.list.useQuery();
  const deleteMutation = api.workflows.delete.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });
  const toggleMutation = api.workflows.toggleActive.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });

  return (
    <div className="flex h-full w-72 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Workflows</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Loading...
          </p>
        )}

        {workflows?.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No workflows yet. Ask Scout to generate one in chat.
          </p>
        )}

        {workflows?.map((wf) => (
          <button
            key={wf.id}
            onClick={() => onSelect(wf.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              selectedId === wf.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{wf.name}</p>
              {wf.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {wf.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMutation.mutate({ id: wf.id });
                }}
              >
                <Power
                  className={cn(
                    "size-3.5",
                    wf.isActive ? "text-emerald-500" : "text-muted-foreground",
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate({ id: wf.id });
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
