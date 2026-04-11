import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const ingestRouter = createTRPCRouter({
  trigger: publicProcedure
    .input(
      z.object({
        postedFrom: z.string().optional(),
        postedTo: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .mutation(async () => {
      // TODO: Phase 1 — call SAM.gov API, embed chunks, store in pgvector
      return { message: "Ingestion not yet implemented" };
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    const [opportunityCount, chunkCount, latest] = await Promise.all([
      ctx.db.opportunity.count(),
      ctx.db.opportunityChunk.count(),
      ctx.db.opportunity.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);
    return {
      opportunityCount,
      chunkCount,
      lastSync: latest?.createdAt ?? null,
    };
  }),
});
