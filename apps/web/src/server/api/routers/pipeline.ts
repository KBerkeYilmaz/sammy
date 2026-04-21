import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { runPipeline } from "~/server/agents/pipeline";
import { scoringProfileInputSchema } from "~/server/agents/schemas";
import { getUserProfileIds } from "~/server/queries";

export const pipelineRouter = createTRPCRouter({
  // Fire-and-forget pipeline run — scoped to user's profile
  runPipeline: protectedProcedure
    .input(z.object({ rescore: z.boolean().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const result = runPipeline({ rescore: input?.rescore, userId });
      result.catch(console.error);
      return { status: "started" };
    }),

  // Score a single opportunity synchronously — scoped to user's profile
  scoreOne: protectedProcedure
    .input(z.object({ opportunityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return runPipeline({ opportunityIds: [input.opportunityId], userId });
    }),

  // Scored opportunities grouped by recommendation — scoped to user's profiles
  getPipeline: protectedProcedure.query(async ({ ctx }) => {
    const profileIds = await getUserProfileIds(ctx.db, ctx.session.user.id);
    const scored = await ctx.db.opportunityScore.findMany({
      where: { profileId: { in: profileIds } },
      include: { opportunity: true },
      orderBy: { fitScore: "desc" },
    });
    return {
      pursue: scored.filter((s) => s.recommendation === "pursue"),
      watch: scored.filter((s) => s.recommendation === "watch"),
      skip: scored.filter((s) => s.recommendation === "skip"),
    };
  }),

  // Capture briefs — scoped to user's profiles
  getCaptureBriefs: protectedProcedure.query(async ({ ctx }) => {
    const profileIds = await getUserProfileIds(ctx.db, ctx.session.user.id);
    return ctx.db.captureBrief.findMany({
      where: { profileId: { in: profileIds } },
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

  // Last 20 workflow runs — scoped to current user
  getRunHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workflowRun.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  }),

  // Single run for polling progress — verify ownership
  getRunById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.workflowRun.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
