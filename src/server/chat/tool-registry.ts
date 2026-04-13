import type { PrismaClient } from "@prisma/client";
import { createSearchTools } from "./tools/search";
import { createPipelineTools } from "./tools/pipeline";
import { createAnalysisTools } from "./tools/analysis";
import { createWorkflowTools } from "./tools/workflow";
import { createOnboardingTools } from "./tools/onboarding";

export function createTools(ctx: { db: PrismaClient; userId: string }) {
  return {
    ...createSearchTools(ctx.db),
    ...createPipelineTools(ctx.db, ctx.userId),
    ...createAnalysisTools(ctx.db, ctx.userId),
    ...createWorkflowTools(ctx.db, ctx.userId),
    ...createOnboardingTools(ctx.db, ctx.userId),
  };
}
