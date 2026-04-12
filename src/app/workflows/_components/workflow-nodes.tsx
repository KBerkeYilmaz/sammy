"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap, Sparkles, GitBranch, Send } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

interface WorkflowNodeData {
  label: string;
  description?: string;
  [key: string]: unknown;
}

function NodeShell({
  data,
  icon: Icon,
  accentColor,
  hasInput = true,
  hasOutput = true,
}: {
  data: WorkflowNodeData;
  icon: typeof Zap;
  accentColor: string;
  hasInput?: boolean;
  hasOutput?: boolean;
}) {
  return (
    <Card className={`w-56 border-2 shadow-md ${accentColor}`}>
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!size-3 !border-2 !border-background !bg-muted-foreground"
        />
      )}
      <CardContent className="flex items-start gap-3 p-3">
        <div className="mt-0.5 rounded-md bg-muted p-1.5">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{data.label}</p>
          {data.description && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {data.description}
            </p>
          )}
        </div>
      </CardContent>
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!size-3 !border-2 !border-background !bg-muted-foreground"
        />
      )}
    </Card>
  );
}

export function TriggerNode({ data }: NodeProps) {
  return (
    <NodeShell
      data={data as unknown as WorkflowNodeData}
      icon={Zap}
      accentColor="border-emerald-500"
      hasInput={false}
    />
  );
}

export function AiActionNode({ data }: NodeProps) {
  return (
    <NodeShell
      data={data as unknown as WorkflowNodeData}
      icon={Sparkles}
      accentColor="border-indigo-500"
    />
  );
}

export function ConditionNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <Card className="w-56 border-2 border-amber-500 shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-background !bg-muted-foreground"
      />
      <CardContent className="flex items-start gap-3 p-3">
        <div className="mt-0.5 rounded-md bg-amber-500/10 p-1.5">
          <GitBranch className="size-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{nodeData.label}</p>
          {nodeData.description && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {nodeData.description}
            </p>
          )}
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "30%" }}
        className="!size-3 !border-2 !border-background !bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "70%" }}
        className="!size-3 !border-2 !border-background !bg-red-500"
      />
    </Card>
  );
}

export function ActionNode({ data }: NodeProps) {
  return (
    <NodeShell
      data={data as unknown as WorkflowNodeData}
      icon={Send}
      accentColor="border-purple-500"
    />
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  ai_action: AiActionNode,
  condition: ConditionNode,
  action: ActionNode,
} as const;
