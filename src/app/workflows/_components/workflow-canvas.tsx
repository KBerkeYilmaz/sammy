"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Panel,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Zap, Sparkles, GitBranch, Send, LayoutGrid } from "lucide-react";
import { Button } from "~/components/ui/button";

import { nodeTypes } from "./workflow-nodes";
import { getLayoutedElements } from "./layout-utils";

const NODE_PALETTE = [
  { type: "trigger", label: "Trigger", icon: Zap, color: "text-emerald-500" },
  { type: "ai_action", label: "AI Action", icon: Sparkles, color: "text-indigo-500" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "text-amber-500" },
  { type: "action", label: "Action", icon: Send, color: "text-purple-500" },
] as const;

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

let nodeIdCounter = 0;

export function WorkflowCanvas({
  nodes: rawNodes,
  edges: rawEdges,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
}: WorkflowCanvasProps) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Track whether changes are from user interaction (not prop sync)
  const isUserEdit = useRef(false);

  useEffect(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(ln);
    setEdges(le);
    // Reset counter based on existing nodes
    const maxId = rawNodes.reduce((max, n) => {
      const num = parseInt(n.id.replace(/\D/g, ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    nodeIdCounter = maxId + 1;
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // Notify parent of changes for auto-save
  useEffect(() => {
    if (isUserEdit.current) {
      isUserEdit.current = false;
      onNodesChangeProp?.(nodes);
      onEdgesChangeProp?.(edges);
    }
  }, [nodes, edges, onNodesChangeProp, onEdgesChangeProp]);

  const onConnect = useCallback(
    (connection: Connection) => {
      isUserEdit.current = true;
      setEdges((eds) =>
        addEdge(
          { ...connection, id: `e-${connection.source}-${connection.target}` },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const handleAddNode = useCallback(
    (type: string) => {
      isUserEdit.current = true;
      const id = `node-${nodeIdCounter++}`;
      const newNode: Node = {
        id,
        type,
        position: { x: 0, y: 0 },
        data: {
          label: NODE_PALETTE.find((p) => p.type === type)?.label ?? type,
          description: "New step",
        },
      };
      // Add node then re-layout so it slots into the DAG cleanly
      setNodes((nds) => {
        const updated = [...nds, newNode];
        const { nodes: ln, edges: le } = getLayoutedElements(updated, edges);
        setEdges(le);
        return ln;
      });
    },
    [setNodes, setEdges, edges],
  );

  const handleAutoLayout = useCallback(() => {
    isUserEdit.current = true;
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
    setNodes(ln);
    setEdges(le);
  }, [nodes, edges, setNodes, setEdges]);

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      // Mark removals and position changes as user edits
      const hasUserChange = changes.some(
        (c) => c.type === "remove" || c.type === "position",
      );
      if (hasUserChange) isUserEdit.current = true;
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      const hasUserChange = changes.some((c) => c.type === "remove");
      if (hasUserChange) isUserEdit.current = true;
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: true,
      style: { strokeWidth: 2 },
    }),
    [],
  );

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Panel position="top-left" className="flex items-center gap-1.5">
          {NODE_PALETTE.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background shadow-sm"
              onClick={() => handleAddNode(type)}
            >
              <Icon className={`size-3.5 ${color}`} />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-background shadow-sm"
            onClick={handleAutoLayout}
          >
            <LayoutGrid className="size-3.5" />
            <span className="text-xs">Auto-layout</span>
          </Button>
        </Panel>
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          className="rounded-lg! border! shadow-sm!"
          maskColor="rgba(0,0,0,0.1)"
        />
        <Background gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
