import { chatRouter } from "~/server/api/routers/chat";
import { ingestRouter } from "~/server/api/routers/ingest";
import { opportunitiesRouter } from "~/server/api/routers/opportunities";
import { workflowRouter } from "~/server/api/routers/workflow";
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
  chat: chatRouter,
  workflow: workflowRouter,
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
