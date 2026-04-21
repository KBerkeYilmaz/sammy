import { generateObject } from "ai";
import type { Opportunity, OpportunityScore } from "@prisma/client";
import { chatModel } from "~/server/bedrock";
import { captureBriefSchema, type CaptureBriefData } from "./schemas";

export async function generateCaptureBrief(
  opportunity: Opportunity,
  score: OpportunityScore,
): Promise<CaptureBriefData> {
  const { object } = await generateObject({
    model: chatModel,
    schema: captureBriefSchema,
    prompt: `You are a GovCon capture manager. Generate a capture brief for this high-priority opportunity.

OPPORTUNITY:
- Title: ${opportunity.title}
- Department: ${opportunity.department}
- Sub-tier: ${opportunity.subTier ?? "N/A"}
- NAICS: ${opportunity.naicsCode ?? "N/A"}
- Solicitation #: ${opportunity.solicitationNumber ?? "N/A"}
- Type: ${opportunity.type}
- Posted: ${opportunity.postedDate.toISOString().split("T")[0]}
- Deadline: ${opportunity.responseDeadline?.toISOString().split("T")[0] ?? "N/A"}
- Award amount: ${opportunity.awardAmount ? `$${opportunity.awardAmount.toLocaleString()}` : "TBD"}

AI SCORING:
- Fit Score: ${score.fitScore}/100
- Recommendation: ${score.recommendation}
- Strengths: ${JSON.stringify(score.keyStrengths)}
- Risks: ${JSON.stringify(score.risks)}
- Rationale: ${score.rationale}

Generate a capture brief with:
1. Executive summary (1 concise paragraph)
2. Key requirements extracted from available data (bullet points)
3. Competitive edge — how to differentiate (1-2 sentences)
4. Suggested team roles needed (list of role titles)
5. Timeline with key dates and milestones`,
  });

  return object;
}
