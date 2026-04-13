"use client";

import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import { WorkflowList } from "~/app/workflows/_components/workflow-list";
import dynamic from "next/dynamic";

const WorkflowCanvas = dynamic(
  () =>
    import("~/app/workflows/_components/workflow-canvas").then(
      (mod) => mod.WorkflowCanvas,
    ),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-muted rounded-lg" /> },
);
import { api } from "~/trpc/react";

export default function WorkflowsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const utils = api.useUtils();
  const { data: workflow } = api.workflows.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const updateMutation = api.workflows.update.useMutation({
    onSuccess: () => utils.workflows.list.invalidate(),
  });

  // Debounced save — waits 1s after last change
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingNodes = useRef<Node[] | null>(null);
  const pendingEdges = useRef<Edge[] | null>(null);

  const flushSave = useCallback(() => {
    if (!selectedId) return;
    const nodes = pendingNodes.current;
    const edges = pendingEdges.current;
    if (!nodes && !edges) return;

    // Strip position data isn't needed — we save it for manual repositioning
    updateMutation.mutate({
      id: selectedId,
      ...(nodes && { nodes: nodes as unknown as Record<string, unknown>[] }),
      ...(edges && { edges: edges as unknown as Record<string, unknown>[] }),
    });

    pendingNodes.current = null;
    pendingEdges.current = null;
  }, [selectedId, updateMutation]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 1000);
  }, [flushSave]);

  const handleNodesChange = useCallback(
    (nodes: Node[]) => {
      pendingNodes.current = nodes;
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleEdgesChange = useCallback(
    (edges: Edge[]) => {
      pendingEdges.current = edges;
      scheduleSave();
    },
    [scheduleSave],
  );

  const nodes = (workflow?.nodes as Node[] | undefined) ?? [];
  const edges = (workflow?.edges as Edge[] | undefined) ?? [];

  return (
    <div className="flex h-full">
      <WorkflowList selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex-1">
        {workflow ? (
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a workflow or ask Sammy to generate one
          </div>
        )}
      </div>
    </div>
  );
}
