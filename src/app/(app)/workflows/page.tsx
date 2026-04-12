"use client";

import { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import { WorkflowList } from "~/app/workflows/_components/workflow-list";
import { WorkflowCanvas } from "~/app/workflows/_components/workflow-canvas";
import { api } from "~/trpc/react";

export default function WorkflowsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: workflow } = api.workflows.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const nodes = (workflow?.nodes as Node[] | undefined) ?? [];
  const edges = (workflow?.edges as Edge[] | undefined) ?? [];

  return (
    <div className="flex h-full">
      <WorkflowList selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex-1">
        {workflow ? (
          <WorkflowCanvas nodes={nodes} edges={edges} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a workflow or ask Scout to generate one
          </div>
        )}
      </div>
    </div>
  );
}
