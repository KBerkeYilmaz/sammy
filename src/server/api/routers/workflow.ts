import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { runPipeline } from "~/server/agents/pipeline";

export const workflowRouter = createTRPCRouter({
  // Fire-and-forget pipeline run on unscored opportunities
  runPipeline: protectedProcedure.mutation(async () => {
    const result = runPipeline();
    // Fire and forget — return immediately, pipeline runs in background
    result.catch(console.error);
    return { status: "started" };
  }),

  // Score a single opportunity synchronously
  scoreOne: protectedProcedure
    .input(z.object({ opportunityId: z.string() }))
    .mutation(async ({ input }) => {
      return runPipeline([input.opportunityId]);
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
      z.object({
        id: z.string(),
        targetNaics: z.array(z.string()),
        targetDepartments: z.array(z.string()),
        preferredSetAsides: z.array(z.string()),
        keywords: z.array(z.string()),
        minContractValue: z.number().nullable(),
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
