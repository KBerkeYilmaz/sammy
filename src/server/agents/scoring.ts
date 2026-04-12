import { generateObject } from "ai";
import type { Opportunity, ScoringProfile } from "@prisma/client";
import { chatModel } from "~/server/bedrock";
import { parseSamJson } from "~/server/sam";
import { scoringResultSchema, type ScoringResult } from "./schemas";

export async function scoreOpportunity(
  opportunity: Opportunity,
  profile: ScoringProfile,
): Promise<ScoringResult> {
  const samData = parseSamJson(opportunity.rawJson);
  const typeOfSetAside = samData.typeOfSetAside ?? "none";

  const { object } = await generateObject({
    model: chatModel,
    schema: scoringResultSchema,
    prompt: `You are a government contracting analyst. Score this opportunity's fit based on the company profile.

COMPANY PROFILE:
- Target NAICS codes: ${JSON.stringify(profile.targetNaics)}
- Target departments: ${JSON.stringify(profile.targetDepartments)}
- Preferred set-asides: ${JSON.stringify(profile.preferredSetAsides)}
- Keywords of interest: ${JSON.stringify(profile.keywords)}
- Minimum contract value: ${profile.minContractValue ?? "none"}

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
- Award amount: ${opportunity.awardAmount ? `$${opportunity.awardAmount.toLocaleString()}` : "N/A"}
- Awardee: ${opportunity.awardeeName ?? "N/A"}

Score the opportunity's fit (0-100) and recommend: pursue (≥80), watch (50-79), or skip (<50).
Consider: NAICS alignment, department match, set-aside preferences, keyword relevance, contract value, and deadline feasibility.`,
  });

  return object;
}
