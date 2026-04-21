import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import { createPipelineTools } from "./pipeline";

// AI SDK v6 wraps inputSchema in FlexibleSchema — cast back to Zod for assertions
function zodSchema(tool: { inputSchema: unknown }): z.ZodTypeAny {
  return tool.inputSchema as z.ZodTypeAny;
}

function createMockDb() {
  return {
    scoringProfile: {
      findMany: vi.fn().mockResolvedValue([{ id: "profile-1" }]),
    },
    opportunityScore: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    captureBrief: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    opportunity: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaClient;
}

const executeOpts = {
  toolCallId: "test",
  messages: [],
  abortSignal: undefined as never,
};

describe("createPipelineTools", () => {
  let db: ReturnType<typeof createMockDb>;
  let tools: ReturnType<typeof createPipelineTools>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockDb();
    tools = createPipelineTools(db, "test-user-id");
  });

  describe("getScoredPipeline", () => {
    it("should pass recommendation filter when not 'all'", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunityScore: { findMany: ReturnType<typeof vi.fn> } })
          .opportunityScore.findMany,
      );

      await tools.getScoredPipeline.execute!(
        { recommendation: "pursue", minScore: undefined },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        profileId: { in: ["profile-1"] },
        recommendation: "pursue",
      });
    });

    it("should not filter recommendation when set to 'all'", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunityScore: { findMany: ReturnType<typeof vi.fn> } })
          .opportunityScore.findMany,
      );

      await tools.getScoredPipeline.execute!(
        { recommendation: "all", minScore: undefined },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        profileId: { in: ["profile-1"] },
      });
    });

    it("should apply minScore filter when provided", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunityScore: { findMany: ReturnType<typeof vi.fn> } })
          .opportunityScore.findMany,
      );

      await tools.getScoredPipeline.execute!(
        { recommendation: "all", minScore: 70 },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        profileId: { in: ["profile-1"] },
        fitScore: { gte: 70 },
      });
    });

    it("should combine recommendation and minScore filters", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunityScore: { findMany: ReturnType<typeof vi.fn> } })
          .opportunityScore.findMany,
      );
      const scoredOpp = {
        id: "s1",
        fitScore: 85,
        recommendation: "pursue",
        opportunity: { title: "Test Opp" },
      };
      mockFindMany.mockResolvedValue([scoredOpp]);

      const result = await tools.getScoredPipeline.execute!(
        { recommendation: "pursue", minScore: 80 },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        profileId: { in: ["profile-1"] },
        recommendation: "pursue",
        fitScore: { gte: 80 },
      });
      expect(result).toEqual({ results: [scoredOpp], count: 1 });
    });

    it("should default recommendation to 'all' in input schema", () => {
      const parsed = zodSchema(tools.getScoredPipeline).parse({}) as { recommendation: string };
      expect(parsed.recommendation).toBe("all");
    });

    it("should validate recommendation enum values", () => {
      const invalid = zodSchema(tools.getScoredPipeline).safeParse({
        recommendation: "invalid",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("getCaptureBrief", () => {
    it("should return the brief when found", async () => {
      const mockFindFirst = vi.mocked(
        (db as unknown as { captureBrief: { findFirst: ReturnType<typeof vi.fn> } })
          .captureBrief.findFirst,
      );
      const brief = {
        id: "b1",
        opportunityId: "opp-1",
        summary: "Test brief",
        opportunity: { title: "Test", department: "DoD", solicitationNumber: "W911" },
      };
      mockFindFirst.mockResolvedValue(brief);

      const result = await tools.getCaptureBrief.execute!(
        { opportunityId: "opp-1" },
        executeOpts,
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { opportunityId: "opp-1", profileId: { in: ["profile-1"] } },
        include: {
          opportunity: {
            select: {
              title: true,
              department: true,
              solicitationNumber: true,
            },
          },
        },
      });
      expect(result).toEqual(brief);
    });

    it("should return error object when brief is not found", async () => {
      const result = await tools.getCaptureBrief.execute!(
        { opportunityId: "nonexistent" },
        executeOpts,
      );

      expect(result).toEqual({
        error: "No capture brief found for this opportunity",
      });
    });

    it("should require opportunityId in input schema", () => {
      const missing = zodSchema(tools.getCaptureBrief).safeParse({});
      expect(missing.success).toBe(false);

      const valid = zodSchema(tools.getCaptureBrief).safeParse({
        opportunityId: "abc",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("deadlineMonitor", () => {
    it("should calculate cutoff date correctly", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([]);

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));

      await tools.deadlineMonitor.execute!(
        { daysAhead: 7, recommendation: "all" },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: { responseDeadline: { gte: Date; lte: Date } };
      };
      const cutoff = callArgs.where.responseDeadline.lte;
      expect(cutoff).toEqual(new Date("2025-06-08T00:00:00Z"));

      vi.useRealTimers();
    });

    it("should map daysRemaining for each opportunity", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));

      mockFindMany.mockResolvedValue([
        {
          title: "Urgent Contract",
          department: "DoD",
          solicitationNumber: "W911-25",
          responseDeadline: new Date("2025-06-04T00:00:00Z"),
          scores: [{ fitScore: 90, recommendation: "pursue", rationale: "Good fit" }],
        },
      ]);

      const result = await tools.deadlineMonitor.execute!(
        { daysAhead: 30, recommendation: "all" },
        executeOpts,
      );

      const data = result as { results: Array<{ daysRemaining: number | null; title: string }>; count: number };
      expect(data.results[0]!.daysRemaining).toBe(3);
      expect(data.results[0]!.title).toBe("Urgent Contract");
      expect(data.count).toBe(1);

      vi.useRealTimers();
    });

    it("should return null daysRemaining when responseDeadline is null", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );

      mockFindMany.mockResolvedValue([
        {
          title: "No Deadline",
          department: "DoD",
          solicitationNumber: "X-1",
          responseDeadline: null,
          scores: [],
        },
      ]);

      const result = await tools.deadlineMonitor.execute!(
        { daysAhead: 30, recommendation: "all" },
        executeOpts,
      );

      const data = result as { results: Array<{ daysRemaining: number | null }> };
      expect(data.results[0]!.daysRemaining).toBeNull();
    });

    it("should filter by recommendation when not 'all'", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([]);

      await tools.deadlineMonitor.execute!(
        { daysAhead: 14, recommendation: "pursue" },
        executeOpts,
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toHaveProperty("scores", {
        some: { recommendation: "pursue", profileId: { in: ["profile-1"] } },
      });
    });

    it("should default daysAhead to 30 in input schema", () => {
      const parsed = zodSchema(tools.deadlineMonitor).parse({}) as { daysAhead: number; recommendation: string };
      expect(parsed.daysAhead).toBe(30);
      expect(parsed.recommendation).toBe("all");
    });
  });

  describe("compareOpportunities", () => {
    it("should pass IDs to findMany with include", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      const opps = [
        { id: "opp-1", title: "First", scores: [{ fitScore: 80 }], captureBriefs: [] },
        { id: "opp-2", title: "Second", scores: [{ fitScore: 60 }], captureBriefs: [] },
      ];
      mockFindMany.mockResolvedValue(opps);

      const result = await tools.compareOpportunities.execute!(
        { opportunityIds: ["opp-1", "opp-2"] },
        executeOpts,
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { id: { in: ["opp-1", "opp-2"] } },
        include: {
          scores: { where: { profileId: { in: ["profile-1"] } }, take: 1 },
          captureBriefs: { where: { profileId: { in: ["profile-1"] } }, take: 1 },
        },
      });
      expect(result).toEqual({ results: opps, count: 2 });
    });

    it("should require at least 2 and at most 3 IDs", () => {
      const one = zodSchema(tools.compareOpportunities).safeParse({
        opportunityIds: ["opp-1"],
      });
      expect(one.success).toBe(false);

      const two = zodSchema(tools.compareOpportunities).safeParse({
        opportunityIds: ["opp-1", "opp-2"],
      });
      expect(two.success).toBe(true);

      const three = zodSchema(tools.compareOpportunities).safeParse({
        opportunityIds: ["opp-1", "opp-2", "opp-3"],
      });
      expect(three.success).toBe(true);

      const four = zodSchema(tools.compareOpportunities).safeParse({
        opportunityIds: ["opp-1", "opp-2", "opp-3", "opp-4"],
      });
      expect(four.success).toBe(false);
    });
  });
});
