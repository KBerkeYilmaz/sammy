import { generateObject } from "ai";
import type { Opportunity, ScoringProfile } from "@prisma/client";
import { chatModel } from "~/server/bedrock";
import { parseSamJson } from "~/server/sam";
import {
  scoringResultSchema,
  type CriteriaScores,
  type ScoringResult,
} from "./schemas";

/** Weights for each scoring criterion (must sum to 1.0) */
export const WEIGHTS = {
  naicsMatch: 0.25,
  departmentMatch: 0.2,
  keywordRelevance: 0.2,
  setAsideMatch: 0.15,
  contractValue: 0.1,
  deadlineFeasibility: 0.1,
} as const;

/** Compute weighted fit score from per-criterion sub-scores */
export function computeFitScore(criteria: CriteriaScores): number {
  return Math.round(
    Object.entries(WEIGHTS).reduce(
      (sum, [key, weight]) =>
        sum + criteria[key as keyof CriteriaScores] * weight,
      0,
    ),
  );
}

/** Derive recommendation from fitScore using profile thresholds */
export function deriveRecommendation(
  fitScore: number,
  pursueThreshold: number,
  watchThreshold: number,
): "pursue" | "watch" | "skip" {
  if (fitScore >= pursueThreshold) return "pursue";
  if (fitScore >= watchThreshold) return "watch";
  return "skip";
}

export async function scoreOpportunity(
  opportunity: Opportunity,
  profile: ScoringProfile,
): Promise<ScoringResult & { fitScore: number }> {
  const samData = parseSamJson(opportunity.rawJson);
  const typeOfSetAside = samData.typeOfSetAside ?? "none";

  const { object } = await generateObject({
    model: chatModel,
    schema: scoringResultSchema,
    temperature: 0,
    prompt: `You are a government contracting analyst. Evaluate this opportunity against the company profile by scoring each criterion independently on a 0-100 scale.

SCORING RUBRIC — score each criterion separately:

1. NAICS Match (0-100):
   100 = exact match to a primary target NAICS code
   70 = match to a secondary/related NAICS code
   30 = adjacent industry, some overlap
   0 = completely unrelated NAICS

2. Department Match (0-100):
   100 = exact match to a target department
   60 = match to a sub-agency of a target department
   30 = related federal agency not in targets
   0 = unrelated agency

3. Keyword Relevance (0-100):
   100 = title/scope strongly matches 3+ keywords
   70 = matches 2 keywords clearly
   40 = matches 1 keyword or tangentially related
   0 = no keyword overlap

4. Set-Aside Match (0-100):
   100 = exact match to a preferred set-aside type
   50 = partial small business preference
   20 = full-and-open but company could compete
   0 = set-aside excludes the company

5. Contract Value (0-100):
   100 = confirmed value well above minimum threshold
   70 = value meets minimum threshold
   50 = value unknown but type suggests adequate size
   20 = value unknown and type suggests small
   0 = confirmed below minimum threshold

6. Deadline Feasibility (0-100):
   100 = 30+ days remaining
   70 = 14-30 days remaining
   40 = 7-14 days remaining
   10 = less than 7 days
   0 = deadline has passed

IMPORTANT: Score each criterion independently. Do NOT let one criterion influence another. Use the full 0-100 range — avoid clustering around middle values.

Based on overall fit, recommend: "pursue" (strong multi-criteria alignment), "watch" (partial alignment worth monitoring), or "skip" (poor fit).

COMPANY PROFILE:
- Target NAICS codes: ${JSON.stringify(profile.targetNaics)}
- Target departments: ${JSON.stringify(profile.targetDepartments)}
- Preferred set-asides: ${JSON.stringify(profile.preferredSetAsides)}
- Keywords of interest: ${JSON.stringify(profile.keywords)}
- Minimum contract value: ${profile.minContractValue ? `$${profile.minContractValue.toLocaleString()}` : "none"}

OPPORTUNITY:
- Title: ${opportunity.title}
- Department: ${opportunity.department}
- Sub-tier: ${opportunity.subTier ?? "N/A"}
- NAICS: ${opportunity.naicsCode ?? "N/A"}
- Type: ${opportunity.type}
- Set-aside: ${typeOfSetAside}
- Posted: ${opportunity.postedDate.toISOString().split("T")[0]}
- Deadline: ${opportunity.responseDeadline?.toISOString().split("T")[0] ?? "N/A"}
- Solicitation #: ${opportunity.solicitationNumber ?? "N/A"}
- Award amount: ${opportunity.awardAmount ? `$${opportunity.awardAmount.toLocaleString()}` : "N/A"}`,
  });

  const fitScore = computeFitScore(object.criteriaScores);
  const recommendation = deriveRecommendation(
    fitScore,
    profile.pursueThreshold,
    profile.watchThreshold,
  );

  return { ...object, fitScore, recommendation };
}
