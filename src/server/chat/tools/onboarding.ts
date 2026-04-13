import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { scoringProfileInputSchema } from "~/server/agents/schemas";

export function createOnboardingTools(db: PrismaClient, userId: string) {
  return {
    setup_company_profile: tool({
      description:
        "Create or update the company's scoring profile based on collected company information. " +
        "Call this when you have enough information about the user's company to build a meaningful scoring profile. " +
        "At minimum, you need the company name, target NAICS codes, and capability keywords.",
      inputSchema: scoringProfileInputSchema.extend({
        companyName: z.string().describe("The company name"),
      }),
      execute: async ({
        companyName,
        targetNaics,
        targetDepartments,
        preferredSetAsides,
        keywords,
        minContractValue,
      }) => {
        // Deactivate existing profiles for this user
        await db.scoringProfile.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });

        // Create new active profile
        const profile = await db.scoringProfile.create({
          data: {
            name: companyName,
            userId,
            isActive: true,
            targetNaics,
            targetDepartments,
            preferredSetAsides,
            keywords,
            minContractValue: minContractValue ?? null,
          },
        });

        const unscoredCount = await db.opportunity.count({
          where: { scores: { none: { profileId: profile.id } } },
        });

        return {
          profileId: profile.id,
          companyName: profile.name,
          message: `Company profile "${companyName}" created and set as active.`,
          unscoredOpportunities: unscoredCount,
          hint:
            unscoredCount > 0
              ? `There are ${unscoredCount} unscored opportunities. Would you like me to run the scoring pipeline against your new profile?`
              : "All opportunities have already been scored.",
        };
      },
    }),
  };
}
