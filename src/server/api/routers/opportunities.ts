import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const opportunitiesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        title: z.string().optional(),
        department: z.string().optional(),
        type: z.string().optional(),
        naicsCode: z.string().optional(),
        activeOnly: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.title && {
          title: { contains: input.title, mode: "insensitive" as const },
        }),
        ...(input.department && {
          department: { contains: input.department, mode: "insensitive" as const },
        }),
        ...(input.type && { type: input.type }),
        ...(input.naicsCode && { naicsCode: input.naicsCode }),
        ...(input.activeOnly === true && { active: true }),
      };
      const [items, total] = await Promise.all([
        ctx.db.opportunity.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { postedDate: "desc" },
        }),
        ctx.db.opportunity.count({ where }),
      ]);
      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.opportunity.findUnique({
        where: { id: input.id },
        include: { chunks: true },
      });
    }),
});
