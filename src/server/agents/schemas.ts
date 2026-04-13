import { z } from "zod";

export const criteriaScoresSchema = z.object({
  naicsMatch: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("0 = no NAICS overlap, 100 = exact primary NAICS match"),
  departmentMatch: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("0 = unrelated agency, 100 = exact target department"),
  keywordRelevance: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("0 = no keyword overlap, 100 = strong multi-keyword alignment"),
  setAsideMatch: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "0 = full-and-open with no preference match, 100 = exact set-aside match",
    ),
  contractValue: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "0 = below minimum or unknown, 50 = unknown but plausible, 100 = confirmed above threshold",
    ),
  deadlineFeasibility: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("0 = deadline passed, 50 = tight but possible, 100 = ample time"),
});

export type CriteriaScores = z.infer<typeof criteriaScoresSchema>;

/** Schema for LLM output — fitScore is computed server-side from criteriaScores */
export const scoringResultSchema = z.object({
  criteriaScores: criteriaScoresSchema,
  recommendation: z.enum(["pursue", "watch", "skip"]),
  rationale: z.string(),
  keyStrengths: z.array(z.string()),
  risks: z.array(z.string()),
});

export type ScoringResult = z.infer<typeof scoringResultSchema>;

export const captureBriefSchema = z.object({
  summary: z.string(),
  keyRequirements: z.array(z.string()),
  competitiveEdge: z.string(),
  suggestedTeam: z.array(z.string()),
  timeline: z.string(),
});

export type CaptureBriefData = z.infer<typeof captureBriefSchema>;
