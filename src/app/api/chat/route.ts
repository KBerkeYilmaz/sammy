import {
  convertToModelMessages,
  smoothStream,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { SCOUT_SYSTEM_PROMPT } from "~/server/prompts";
import { chatModel } from "~/server/bedrock";
import { semanticSearch, formatChunks, getOpportunityCount } from "~/server/rag";
import { db } from "~/server/db";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const totalCount = await getOpportunityCount();

  const system =
    SCOUT_SYSTEM_PROMPT +
    `\n\nYou currently have access to ${totalCount} federal contract opportunities in the database. ` +
    `Use the provided tools to search for opportunities before answering. ` +
    `Always search first — do not guess or claim you have no data without searching.`;

  const result = streamText({
    model: chatModel,
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
    tools: {
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
            select: {
              title: true,
              solicitationNumber: true,
              department: true,
              subTier: true,
              type: true,
              naicsCode: true,
              postedDate: true,
              responseDeadline: true,
              active: true,
              contactName: true,
              contactEmail: true,
              state: true,
              noticeId: true,
            },
          });
          return { results: rows, count: rows.length };
        },
      }),

      searchBySemantic: tool({
        description:
          "Semantic search across opportunity descriptions using embeddings. " +
          "Use this for broad conceptual queries like 'cybersecurity contracts' or 'construction projects in California'.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Natural language search query"),
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
            .describe(
              "Opportunity type: Solicitation, Award Notice, etc.",
            ),
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
            select: {
              title: true,
              solicitationNumber: true,
              department: true,
              type: true,
              naicsCode: true,
              postedDate: true,
              responseDeadline: true,
              active: true,
              state: true,
            },
          });
          return { results: rows, count: rows.length };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
