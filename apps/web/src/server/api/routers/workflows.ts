import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const workflowsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workflow.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.workflow.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        nodes: z.array(z.record(z.string(), z.unknown())),
        edges: z.array(z.record(z.string(), z.unknown())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workflow.create({
        data: {
          name: input.name,
          description: input.description,
          nodes: input.nodes as Prisma.InputJsonValue,
          edges: input.edges as Prisma.InputJsonValue,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        nodes: z.array(z.record(z.string(), z.unknown())).optional(),
        edges: z.array(z.record(z.string(), z.unknown())).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges, ...rest } = input;
      return ctx.db.workflow.update({
        where: { id, userId: ctx.session.user.id },
        data: {
          ...rest,
          ...(nodes && { nodes: nodes as Prisma.InputJsonValue }),
          ...(edges && { edges: edges as Prisma.InputJsonValue }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workflow.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findFirstOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return ctx.db.workflow.update({
        where: { id: input.id },
        data: { isActive: !workflow.isActive },
      });
    }),
});
