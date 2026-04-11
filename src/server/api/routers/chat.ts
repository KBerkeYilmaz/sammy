import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  send: publicProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Phase 2 — embed query, vector search, call Bedrock Claude, stream response
      const session = input.sessionId
        ? await ctx.db.chatSession.findUnique({ where: { id: input.sessionId } })
        : await ctx.db.chatSession.create({ data: { messages: [] } });

      return {
        sessionId: session?.id,
        reply: "RAG pipeline not yet implemented",
      };
    }),

  sessions: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
  }),
});
