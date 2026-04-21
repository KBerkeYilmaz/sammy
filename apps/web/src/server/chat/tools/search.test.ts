import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import { createSearchTools } from "./search";

// AI SDK v6 wraps inputSchema in FlexibleSchema — cast back to Zod for assertions
function zodSchema(tool: { inputSchema: unknown }): z.ZodTypeAny {
  return tool.inputSchema as z.ZodTypeAny;
}

vi.mock("~/server/rag", () => ({
  semanticSearch: vi.fn(),
  formatChunks: vi.fn(),
}));

import { semanticSearch, formatChunks } from "~/server/rag";

const mockSemanticSearch = vi.mocked(semanticSearch);
const mockFormatChunks = vi.mocked(formatChunks);

function createMockDb() {
  return {
    opportunity: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaClient;
}

const sampleOpportunity = {
  title: "Cybersecurity Support Services",
  solicitationNumber: "W911-24-R-0001",
  department: "Department of Defense",
  subTier: "Army",
  type: "Solicitation",
  naicsCode: "541512",
  postedDate: new Date("2025-01-15"),
  responseDeadline: new Date("2025-02-15"),
  active: true,
  contactName: "Jane Doe",
  contactEmail: "jane@army.mil",
  state: "VA",
  noticeId: "abc-123",
};

describe("createSearchTools", () => {
  let db: ReturnType<typeof createMockDb>;
  let tools: ReturnType<typeof createSearchTools>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockDb();
    tools = createSearchTools(db);
  });

  describe("searchByKeyword", () => {
    it("should call findMany with OR conditions for the query", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([sampleOpportunity]);

      const result = await tools.searchByKeyword.execute!(
        { query: "cybersecurity", limit: 10 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      expect(mockFindMany).toHaveBeenCalledOnce();
      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: { OR: Array<Record<string, unknown>> };
      };
      expect(callArgs.where.OR).toHaveLength(7);
      expect(callArgs.where.OR[0]).toEqual({
        title: { contains: "cybersecurity", mode: "insensitive" },
      });
      expect(result).toEqual({ results: [sampleOpportunity], count: 1 });
    });

    it("should respect the limit parameter", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([]);

      await tools.searchByKeyword.execute!(
        { query: "test", limit: 5 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as { take: number };
      expect(callArgs.take).toBe(5);
    });

    it("should return empty results when nothing matches", async () => {
      const result = await tools.searchByKeyword.execute!(
        { query: "nonexistent", limit: 10 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      expect(result).toEqual({ results: [], count: 0 });
    });

    it("should have a valid input schema that requires query", () => {
      const valid = zodSchema(tools.searchByKeyword).safeParse({
        query: "test",
      });
      expect(valid.success).toBe(true);

      const missing = zodSchema(tools.searchByKeyword).safeParse({});
      expect(missing.success).toBe(false);
    });

    it("should default limit to 10 in the input schema", () => {
      const parsed = zodSchema(tools.searchByKeyword).parse({
        query: "test",
      }) as { limit: number };
      expect(parsed.limit).toBe(10);
    });
  });

  describe("searchBySemantic", () => {
    it("should call semanticSearch and formatChunks", async () => {
      const chunks = [
        { id: "c1", content: "Cyber contract", metadata: {}, similarity: 0.9 },
      ];
      mockSemanticSearch.mockResolvedValue(chunks);
      mockFormatChunks.mockReturnValue("[1] Cyber contract");

      const result = await tools.searchBySemantic.execute!(
        { query: "cybersecurity", limit: 5 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      expect(mockSemanticSearch).toHaveBeenCalledWith("cybersecurity", 5);
      expect(mockFormatChunks).toHaveBeenCalledWith(chunks);
      expect(result).toEqual({
        results: "[1] Cyber contract",
        count: 1,
      });
    });

    it("should have a valid input schema that requires query", () => {
      const valid = zodSchema(tools.searchBySemantic).safeParse({
        query: "test",
      });
      expect(valid.success).toBe(true);

      const missing = zodSchema(tools.searchBySemantic).safeParse({});
      expect(missing.success).toBe(false);
    });
  });

  describe("filterOpportunities", () => {
    it("should build where clause from department filter", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([sampleOpportunity]);

      await tools.filterOpportunities.execute!(
        { department: "Defense", limit: 15 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        department: { contains: "Defense", mode: "insensitive" },
      });
    });

    it("should include activeOnly filter when set to true", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([]);

      await tools.filterOpportunities.execute!(
        { activeOnly: true, limit: 15 },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({ active: true });
    });

    it("should combine multiple filters", async () => {
      const mockFindMany = vi.mocked(
        (db as unknown as { opportunity: { findMany: ReturnType<typeof vi.fn> } })
          .opportunity.findMany,
      );
      mockFindMany.mockResolvedValue([]);

      await tools.filterOpportunities.execute!(
        {
          department: "Navy",
          type: "Solicitation",
          naicsCode: "541512",
          activeOnly: true,
          limit: 10,
        },
        { toolCallId: "test", messages: [], abortSignal: undefined as never },
      );

      const callArgs = mockFindMany.mock.calls[0]![0] as {
        where: Record<string, unknown>;
      };
      expect(callArgs.where).toEqual({
        department: { contains: "Navy", mode: "insensitive" },
        type: "Solicitation",
        naicsCode: "541512",
        active: true,
      });
    });

    it("should default limit to 15 in the input schema", () => {
      const parsed = zodSchema(tools.filterOpportunities).parse({}) as { limit: number };
      expect(parsed.limit).toBe(15);
    });
  });
});
