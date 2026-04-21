"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Power, Plus, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface WorkflowListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WorkflowList({ selectedId, onSelect }: WorkflowListProps) {
  const utils = api.useUtils();
  const { data: workflows, isLoading } = api.workflows.list.useQuery();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const createMutation = api.workflows.create.useMutation({
    onSuccess: (newWorkflow) => {
      void utils.workflows.list.invalidate();
      onSelect(newWorkflow.id);
      // Auto-enter rename mode for new workflows
      setEditingId(newWorkflow.id);
      setEditingName(newWorkflow.name);
    },
  });
  const updateMutation = api.workflows.update.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });
  const deleteMutation = api.workflows.delete.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });
  const toggleMutation = api.workflows.toggleActive.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  function commitRename(id: string) {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== workflows?.find((w) => w.id === id)?.name) {
      updateMutation.mutate({ id, name: trimmed });
    }
    setEditingId(null);
  }

  return (
    <div className="flex h-full w-72 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Workflows</h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() =>
            createMutation.mutate({
              name: "Untitled Workflow",
              nodes: [],
              edges: [],
            })
          }
          disabled={createMutation.isPending}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Loading...
          </p>
        )}

        {workflows?.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No workflows yet. Ask Sammy to generate one in chat.
          </p>
        )}

        {workflows?.map((wf) => (
          <div
            key={wf.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(wf.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(wf.id)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              selectedId === wf.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50",
            )}
          >
            <div className="min-w-0 flex-1">
              {editingId === wf.id ? (
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(wf.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") commitRename(wf.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 px-1 text-sm font-medium"
                />
              ) : (
                <p
                  className="truncate font-medium"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(wf.id);
                    setEditingName(wf.name);
                  }}
                >
                  {wf.name}
                </p>
              )}
              {wf.description && editingId !== wf.id && (
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
                  setEditingId(wf.id);
                  setEditingName(wf.name);
                }}
              >
                <Pencil className="size-3 text-muted-foreground" />
              </Button>
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
          </div>
        ))}
      </div>
    </div>
  );
}
