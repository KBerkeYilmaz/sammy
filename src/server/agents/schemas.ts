import { z } from "zod";

/** Shared recommendation enum — base values used across scoring and pipeline tools */
export const recommendationEnum = z.enum(["pursue", "watch", "skip"]);
export const recommendationWithAllEnum = z.enum(["pursue", "watch", "skip", "all"]);
export const recommendationFilterEnum = z.enum(["pursue", "watch", "all"]);

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
  recommendation: recommendationEnum,
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

/** Scoring profile input — shared between tRPC router and onboarding chat tool */
export const scoringProfileInputSchema = z.object({
  targetNaics: z.array(z.string()),
  targetDepartments: z.array(z.string()).optional().default([]),
  preferredSetAsides: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()),
  minContractValue: z.number().nullable().optional(),
});

/** Workflow node schema — shared between chat tool and workflows router */
export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["trigger", "ai_action", "condition", "action"]),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
  }),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
});
