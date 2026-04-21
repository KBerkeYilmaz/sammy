import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import { createWorkflowTools } from "./workflow";

// AI SDK v6 wraps inputSchema in FlexibleSchema — cast back to Zod for assertions
function zodSchema(tool: { inputSchema: unknown }): z.ZodTypeAny {
  return tool.inputSchema as z.ZodTypeAny;
}

function createMockDb() {
  return {
    workflow: {
      create: vi.fn().mockResolvedValue({ id: "wf-1", name: "Test Workflow" }),
    },
  } as unknown as PrismaClient;
}

const executeOpts = {
  toolCallId: "test",
  messages: [],
  abortSignal: undefined as never,
};

const sampleNodes = [
  {
    id: "n1",
    type: "trigger" as const,
    data: { label: "New Opportunity", description: "Triggers on SAM.gov import" },
  },
  {
    id: "n2",
    type: "ai_action" as const,
    data: { label: "Score", description: "Run AI scoring" },
  },
  {
    id: "n3",
    type: "condition" as const,
    data: { label: "Score > 70?" },
  },
  {
    id: "n4",
    type: "action" as const,
    data: { label: "Notify Team" },
  },
];

const sampleEdges = [
  { id: "e1", source: "n1", target: "n2" },
  { id: "e2", source: "n2", target: "n3" },
  { id: "e3", source: "n3", target: "n4", sourceHandle: "yes" },
];

describe("createWorkflowTools", () => {
  let db: ReturnType<typeof createMockDb>;
  let tools: ReturnType<typeof createWorkflowTools>;
  const userId = "user-abc-123";

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockDb();
    tools = createWorkflowTools(db, userId);
  });

  describe("generate_workflow", () => {
    it("should create a workflow with correct data shape", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { workflow: { create: ReturnType<typeof vi.fn> } })
          .workflow.create,
      );

      await tools.generate_workflow.execute!(
        {
          name: "Scoring Pipeline",
          description: "Auto-score new opportunities",
          nodes: sampleNodes,
          edges: sampleEdges,
        },
        executeOpts,
      );

      expect(mockCreate).toHaveBeenCalledOnce();
      const callArgs = mockCreate.mock.calls[0]![0] as {
        data: Record<string, unknown>;
      };
      expect(callArgs.data.name).toBe("Scoring Pipeline");
      expect(callArgs.data.description).toBe("Auto-score new opportunities");
      expect(callArgs.data.userId).toBe(userId);
    });

    it("should add position {x:0, y:0} to each node", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { workflow: { create: ReturnType<typeof vi.fn> } })
          .workflow.create,
      );

      await tools.generate_workflow.execute!(
        {
          name: "Test WF",
          nodes: sampleNodes,
          edges: sampleEdges,
        },
        executeOpts,
      );

      const callArgs = mockCreate.mock.calls[0]![0] as {
        data: { nodes: Array<{ position: { x: number; y: number } }> };
      };
      const nodes = callArgs.data.nodes;
      for (const node of nodes) {
        expect(node.position).toEqual({ x: 0, y: 0 });
      }
    });

    it("should preserve original node properties alongside position", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { workflow: { create: ReturnType<typeof vi.fn> } })
          .workflow.create,
      );

      await tools.generate_workflow.execute!(
        {
          name: "Test WF",
          nodes: [sampleNodes[0]!],
          edges: [],
        },
        executeOpts,
      );

      const callArgs = mockCreate.mock.calls[0]![0] as {
        data: {
          nodes: Array<{
            id: string;
            type: string;
            data: { label: string };
            position: { x: number; y: number };
          }>;
        };
      };
      const node = callArgs.data.nodes[0]!;
      expect(node.id).toBe("n1");
      expect(node.type).toBe("trigger");
      expect(node.data.label).toBe("New Opportunity");
      expect(node.position).toEqual({ x: 0, y: 0 });
    });

    it("should use the provided userId", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { workflow: { create: ReturnType<typeof vi.fn> } })
          .workflow.create,
      );

      await tools.generate_workflow.execute!(
        { name: "WF", nodes: [], edges: [] },
        executeOpts,
      );

      const callArgs = mockCreate.mock.calls[0]![0] as {
        data: { userId: string };
      };
      expect(callArgs.data.userId).toBe("user-abc-123");
    });

    it("should return workflowId and counts", async () => {
      const result = await tools.generate_workflow.execute!(
        {
          name: "Pipeline",
          nodes: sampleNodes,
          edges: sampleEdges,
        },
        executeOpts,
      );

      expect(result).toEqual({
        workflowId: "wf-1",
        name: "Test Workflow",
        nodeCount: 4,
        edgeCount: 3,
        message: 'Workflow "Pipeline" saved with 4 steps. View it at /workflows.',
      });
    });

    it("should validate node type enum in input schema", () => {
      const invalid = zodSchema(tools.generate_workflow).safeParse({
        name: "Test",
        nodes: [{ id: "n1", type: "invalid_type", data: { label: "X" } }],
        edges: [],
      });
      expect(invalid.success).toBe(false);
    });

    it("should require name in input schema", () => {
      const missing = zodSchema(tools.generate_workflow).safeParse({
        nodes: [],
        edges: [],
      });
      expect(missing.success).toBe(false);
    });

    it("should allow optional description and sourceHandle", () => {
      const parsed = zodSchema(tools.generate_workflow).safeParse({
        name: "Test",
        nodes: [{ id: "n1", type: "trigger", data: { label: "Start" } }],
        edges: [{ id: "e1", source: "n1", target: "n2" }],
      });
      expect(parsed.success).toBe(true);

      const withOptionals = zodSchema(tools.generate_workflow).safeParse({
        name: "Test",
        description: "A description",
        nodes: [
          { id: "n1", type: "condition", data: { label: "Check", description: "..." } },
        ],
        edges: [{ id: "e1", source: "n1", target: "n2", sourceHandle: "yes" }],
      });
      expect(withOptionals.success).toBe(true);
    });
  });
});
