import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  send: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = input.sessionId
        ? await ctx.db.chatSession.findUnique({ where: { id: input.sessionId } })
        : await ctx.db.chatSession.create({
            data: { messages: [], userId: ctx.session.user.id },
          });

      return {
        sessionId: session?.id,
        reply: "RAG pipeline not yet implemented",
      };
    }),

  sessions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.chatSession.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
  }),
});
