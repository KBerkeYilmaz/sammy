import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { workflowNodeSchema, workflowEdgeSchema } from "~/server/agents/schemas";

export function createWorkflowTools(db: PrismaClient, userId: string) {
  return {
    generate_workflow: tool({
      description:
        "Generate and save a visual workflow definition with nodes and edges. " +
        "Use when users ask to create, build, or generate an automation workflow. " +
        "Node types: trigger (start event), ai_action (AI processing step), condition (branching logic), action (output/notification). " +
        "Each node needs: id, type, data: { label, description }. " +
        "Each edge needs: id, source, target (and optional sourceHandle 'yes'/'no' for condition nodes).",
      inputSchema: z.object({
        name: z.string().describe("Workflow name"),
        description: z.string().optional().describe("Brief description"),
        nodes: z.array(workflowNodeSchema),
        edges: z.array(workflowEdgeSchema),
      }),
      execute: async ({ name, description, nodes, edges }) => {
        const workflow = await db.workflow.create({
          data: {
            name,
            description,
            nodes: nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
            edges,
            userId,
          },
        });
        return {
          workflowId: workflow.id,
          name: workflow.name,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          message: `Workflow "${name}" saved with ${nodes.length} steps. View it at /workflows.`,
        };
      },
    }),
  };
}
