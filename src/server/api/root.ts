import { ingestRouter } from "~/server/api/routers/ingest";
import { opportunitiesRouter } from "~/server/api/routers/opportunities";
import { pipelineRouter } from "~/server/api/routers/pipeline";
import { workflowsRouter } from "~/server/api/routers/workflows";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  opportunities: opportunitiesRouter,
  ingest: ingestRouter,
  pipeline: pipelineRouter,
  workflows: workflowsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
