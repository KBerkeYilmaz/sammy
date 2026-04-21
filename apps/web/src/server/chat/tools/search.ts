import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { semanticSearch, formatChunks } from "~/server/rag";
import { opportunitySelectDetail, opportunitySelectFilter } from "~/server/queries";

export function createSearchTools(db: PrismaClient) {
  return {
    searchByKeyword: tool({
      description:
        "Search opportunities by keyword across title, solicitation number, department, NAICS code, or contact name. " +
        "Use this for specific lookups like solicitation numbers, agency names, or contract titles.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Search term — a title, solicitation number, NAICS code, department, or keyword",
          ),
        limit: z.number().default(10).describe("Max results to return"),
      }),
      execute: async ({ query, limit }) => {
        const rows = await db.opportunity.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              {
                solicitationNumber: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              { department: { contains: query, mode: "insensitive" } },
              { naicsCode: { contains: query, mode: "insensitive" } },
              { noticeId: { contains: query, mode: "insensitive" } },
              { contactName: { contains: query, mode: "insensitive" } },
              { subTier: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          orderBy: { postedDate: "desc" },
          select: opportunitySelectDetail,
        });
        return { results: rows, count: rows.length };
      },
    }),

    searchBySemantic: tool({
      description:
        "Semantic search across opportunity descriptions using embeddings. " +
        "Use this for broad conceptual queries like 'cybersecurity contracts' or 'construction projects in California'.",
      inputSchema: z.object({
        query: z.string().describe("Natural language search query"),
        limit: z.number().default(10).describe("Max results to return"),
      }),
      execute: async ({ query, limit }) => {
        const chunks = await semanticSearch(query, limit);
        return { results: formatChunks(chunks), count: chunks.length };
      },
    }),

    filterOpportunities: tool({
      description:
        "Filter opportunities by structured fields like department, type, NAICS code, or active status.",
      inputSchema: z.object({
        department: z
          .string()
          .optional()
          .describe("Department name (partial match)"),
        type: z
          .string()
          .optional()
          .describe("Opportunity type: Solicitation, Award Notice, etc."),
        naicsCode: z.string().optional().describe("NAICS code"),
        activeOnly: z
          .boolean()
          .optional()
          .describe("Only return active opportunities"),
        limit: z.number().default(15).describe("Max results"),
      }),
      execute: async ({ department, type, naicsCode, activeOnly, limit }) => {
        const rows = await db.opportunity.findMany({
          where: {
            ...(department && {
              department: {
                contains: department,
                mode: "insensitive" as const,
              },
            }),
            ...(type && { type }),
            ...(naicsCode && { naicsCode }),
            ...(activeOnly && { active: true }),
          },
          take: limit,
          orderBy: { postedDate: "desc" },
          select: opportunitySelectFilter,
        });
        return { results: rows, count: rows.length };
      },
    }),
  };
}
