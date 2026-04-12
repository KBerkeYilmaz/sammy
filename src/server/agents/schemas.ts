import { z } from "zod";

export const scoringResultSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
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
