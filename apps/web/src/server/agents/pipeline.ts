import { db } from "~/server/db";
import { scoreOpportunity } from "./scoring";
import { generateCaptureBrief } from "./capture-brief";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;

const DEFAULT_PROFILE = {
  name: "Default Profile",
  isActive: true,
  targetNaics: ["541512", "541519", "541511", "541330", "518210"],
  targetDepartments: [
    "DEPARTMENT OF DEFENSE",
    "DEPARTMENT OF HOMELAND SECURITY",
    "DEPARTMENT OF VETERANS AFFAIRS",
  ],
  preferredSetAsides: ["SBA", "Total Small Business"],
  keywords: [
    "cybersecurity",
    "cloud",
    "artificial intelligence",
    "software development",
    "data analytics",
    "IT modernization",
  ],
  minContractValue: 100000,
  pursueThreshold: 70,
  watchThreshold: 40,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPipeline(opts?: {
  opportunityIds?: string[];
  rescore?: boolean;
  userId?: string;
}) {
  // 1. Get or create active scoring profile — scoped to user when provided
  const existingProfile = await db.scoringProfile.findFirst({
    where: {
      isActive: true,
      ...(opts?.userId && { userId: opts.userId }),
    },
  });

  const profile =
    existingProfile ??
    (await db.scoringProfile.create({
      data: { ...DEFAULT_PROFILE, ...(opts?.userId && { userId: opts.userId }) },
    }));

  // 2. If rescoring, clear THIS profile's scores and briefs
  if (opts?.rescore) {
    const where = {
      profileId: profile.id,
      ...(opts.opportunityIds && { opportunityId: { in: opts.opportunityIds } }),
    };
    await db.captureBrief.deleteMany({ where });
    await db.opportunityScore.deleteMany({ where });
  }

  // 3. Get opportunities not yet scored BY THIS PROFILE
  const opportunities = await db.opportunity.findMany({
    where: {
      ...(opts?.opportunityIds ? { id: { in: opts.opportunityIds } } : {}),
      scores: { none: { profileId: profile.id } },
      awardeeName: null, // Don't score already-awarded contracts
    },
    orderBy: { postedDate: "desc" },
  });

  if (opportunities.length === 0) {
    return { runId: null, message: "No unscored opportunities found" };
  }

  // 3. Create workflow run — tagged to user
  const run = await db.workflowRun.create({
    data: {
      type: opts?.opportunityIds ? "scoring" : "full_pipeline",
      status: "running",
      results: { scored: 0, pursue: 0, watch: 0, skip: 0, briefsGenerated: 0 },
      ...(opts?.userId && { userId: opts.userId }),
    },
  });

  const results = { scored: 0, pursue: 0, watch: 0, skip: 0, briefsGenerated: 0 };

  try {
    // 4. Score in batches
    for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
      const batch = opportunities.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (opp) => {
          const scoreResult = await scoreOpportunity(opp, profile);

          const savedScore = await db.opportunityScore.create({
            data: {
              opportunityId: opp.id,
              profileId: profile.id,
              fitScore: scoreResult.fitScore,
              recommendation: scoreResult.recommendation,
              rationale: scoreResult.rationale,
              keyStrengths: scoreResult.keyStrengths,
              risks: scoreResult.risks,
              criteriaScores: scoreResult.criteriaScores,
            },
          });

          results.scored++;
          results[scoreResult.recommendation]++;

          // 5. Generate capture brief for "pursue" recommendations
          if (scoreResult.recommendation === "pursue") {
            const briefData = await generateCaptureBrief(opp, savedScore);
            await db.captureBrief.create({
              data: {
                opportunityId: opp.id,
                profileId: profile.id,
                ...briefData,
              },
            });
            results.briefsGenerated++;
          }
        }),
      );

      // Rate limit delay between batches
      if (i + BATCH_SIZE < opportunities.length) {
        await sleep(BATCH_DELAY_MS);
      }

      // Update progress
      await db.workflowRun.update({
        where: { id: run.id },
        data: { results, opportunitiesProcessed: results.scored },
      });
    }

    // 6. Mark completed
    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        results,
        opportunitiesProcessed: results.scored,
      },
    });
  } catch (error) {
    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        results,
        opportunitiesProcessed: results.scored,
        errors: { message: error instanceof Error ? error.message : String(error) },
      },
    });
    throw error;
  }

  return { runId: run.id };
}
