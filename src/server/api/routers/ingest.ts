import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { fetchOpportunities } from "~/server/sam";
import { ingestOpportunities } from "~/server/ingestion";

export const ingestRouter = createTRPCRouter({
  trigger: publicProcedure
    .input(
      z.object({
        postedFrom: z.string().optional(), // MM/DD/YYYY
        postedTo: z.string().optional(),   // MM/DD/YYYY
        limit: z.number().min(1).max(1000).default(1000),
        ptype: z.string().optional(),
        naicsCode: z.string().optional(),
        deptname: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { opportunities, total } = await fetchOpportunities({
        postedFrom: input.postedFrom,
        postedTo: input.postedTo,
        limit: input.limit,
        ptype: input.ptype,
        naicsCode: input.naicsCode,
        deptname: input.deptname,
      });

      const result = await ingestOpportunities(opportunities);

      return {
        fetched: opportunities.length,
        totalAvailable: total,
        ...result,
      };
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
