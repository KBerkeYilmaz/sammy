import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { recommendationWithAllEnum, recommendationFilterEnum } from "~/server/agents/schemas";
import { opportunitySelectSummary, opportunitySelectBasic } from "~/server/queries";
import { getUserProfileIds } from "~/server/queries";

export function createPipelineTools(db: PrismaClient, userId: string) {
  return {
    getScoredPipeline: tool({
      description:
        "Get AI-scored opportunities grouped by recommendation (pursue/watch/skip) with fit scores and rationale. " +
        "Use when users ask about pipeline, recommendations, what to pursue, or scored opportunities.",
      inputSchema: z.object({
        recommendation: recommendationWithAllEnum
          .default("all")
          .describe("Filter by recommendation type"),
        minScore: z
          .number()
          .optional()
          .describe("Minimum fit score to include"),
      }),
      execute: async ({ recommendation, minScore }) => {
        const profileIds = await getUserProfileIds(db, userId);
        const scored = await db.opportunityScore.findMany({
          where: {
            profileId: { in: profileIds },
            ...(recommendation !== "all" && { recommendation }),
            ...(minScore && { fitScore: { gte: minScore } }),
          },
          include: {
            opportunity: { select: opportunitySelectSummary },
          },
          orderBy: { fitScore: "desc" },
          take: 20,
        });
        return { results: scored, count: scored.length };
      },
    }),

    getCaptureBrief: tool({
      description:
        "Get the auto-generated capture brief for a specific opportunity. " +
        "Use when users ask about a capture brief, strategy, or detailed analysis of a specific opportunity.",
      inputSchema: z.object({
        opportunityId: z.string().describe("The opportunity ID"),
      }),
      execute: async ({ opportunityId }) => {
        const profileIds = await getUserProfileIds(db, userId);
        const brief = await db.captureBrief.findFirst({
          where: { opportunityId, profileId: { in: profileIds } },
          include: {
            opportunity: { select: opportunitySelectBasic },
          },
        });
        return brief ?? { error: "No capture brief found for this opportunity" };
      },
    }),

    deadlineMonitor: tool({
      description:
        "Find opportunities with approaching deadlines within N days, sorted by urgency. " +
        "Returns deadline, days remaining, fit score, and recommendation. " +
        "Use when users ask about upcoming deadlines, urgent opportunities, or time-sensitive items.",
      inputSchema: z.object({
        daysAhead: z
          .number()
          .default(30)
          .describe("Number of days to look ahead"),
        recommendation: recommendationFilterEnum
          .default("all")
          .describe("Filter by recommendation type"),
      }),
      execute: async ({ daysAhead, recommendation }) => {
        const profileIds = await getUserProfileIds(db, userId);
        const now = new Date();
        const cutoff = new Date(
          now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
        );

        const opps = await db.opportunity.findMany({
          where: {
            responseDeadline: { gte: now, lte: cutoff },
            ...(recommendation !== "all" && {
              scores: { some: { recommendation, profileId: { in: profileIds } } },
            }),
          },
          include: {
            scores: {
              where: { profileId: { in: profileIds } },
              select: {
                fitScore: true,
                recommendation: true,
                rationale: true,
              },
              take: 1,
            },
          },
          orderBy: { responseDeadline: "asc" },
          take: 20,
        });

        return {
          results: opps.map((o) => ({
            title: o.title,
            department: o.department,
            solicitationNumber: o.solicitationNumber,
            responseDeadline: o.responseDeadline,
            daysRemaining: o.responseDeadline
              ? Math.ceil(
                  (o.responseDeadline.getTime() - now.getTime()) /
                    (24 * 60 * 60 * 1000),
                )
              : null,
            score: o.scores[0] ?? null,
          })),
          count: opps.length,
        };
      },
    }),

    compareOpportunities: tool({
      description:
        "Side-by-side comparison of 2-3 opportunities analyzing fit score, requirements, timeline, contract value, and strategic recommendation. " +
        "Use when users want to compare specific opportunities.",
      inputSchema: z.object({
        opportunityIds: z
          .array(z.string())
          .min(2)
          .max(3)
          .describe("2-3 opportunity IDs to compare"),
      }),
      execute: async ({ opportunityIds }) => {
        const profileIds = await getUserProfileIds(db, userId);
        const opps = await db.opportunity.findMany({
          where: { id: { in: opportunityIds } },
          include: {
            scores: { where: { profileId: { in: profileIds } }, take: 1 },
            captureBriefs: { where: { profileId: { in: profileIds } }, take: 1 },
          },
        });
        return { results: opps, count: opps.length };
      },
    }),
  };
}
