import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { runPipeline } from "~/server/agents/pipeline";
import { scoringProfileInputSchema } from "~/server/agents/schemas";

export const pipelineRouter = createTRPCRouter({
  // Fire-and-forget pipeline run
  runPipeline: protectedProcedure
    .input(z.object({ rescore: z.boolean().optional() }).optional())
    .mutation(async ({ input }) => {
      const result = runPipeline({ rescore: input?.rescore });
      // Fire and forget — return immediately, pipeline runs in background
      result.catch(console.error);
      return { status: "started" };
    }),

  // Score a single opportunity synchronously
  scoreOne: protectedProcedure
    .input(z.object({ opportunityId: z.string() }))
    .mutation(async ({ input }) => {
      return runPipeline({ opportunityIds: [input.opportunityId] });
    }),

  // Scored opportunities grouped by recommendation
  getPipeline: protectedProcedure.query(async ({ ctx }) => {
    const scored = await ctx.db.opportunityScore.findMany({
      include: { opportunity: true },
      orderBy: { fitScore: "desc" },
    });
    return {
      pursue: scored.filter((s) => s.recommendation === "pursue"),
      watch: scored.filter((s) => s.recommendation === "watch"),
      skip: scored.filter((s) => s.recommendation === "skip"),
    };
  }),

  // All capture briefs with opportunity data
  getCaptureBriefs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.captureBrief.findMany({
      include: { opportunity: true },
      orderBy: { generatedAt: "desc" },
    });
  }),

  // Active scoring profile — scoped to current user
  getScoringProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.scoringProfile.findFirst({
      where: { isActive: true, userId: ctx.session.user.id },
    });
  }),

  // Update scoring profile — verify ownership
  updateScoringProfile: protectedProcedure
    .input(
      scoringProfileInputSchema.extend({
        id: z.string(),
        minContractValue: z.number().nullable(),
        pursueThreshold: z.number().int().min(0).max(100).default(70),
        watchThreshold: z.number().int().min(0).max(100).default(40),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.scoringProfile.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  // Last 20 workflow runs
  getRunHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workflowRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  }),

  // Single run for polling progress
  getRunById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.workflowRun.findUnique({ where: { id: input.id } });
    }),
});
