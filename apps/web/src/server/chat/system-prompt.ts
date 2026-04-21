import { SCOUT_SYSTEM_PROMPT } from "~/server/prompts";

export function buildSystemPrompt(opts: {
  totalCount: number;
  scoredCount: number;
  activeProfile: { name: string; targetNaics: string[] } | null;
}): string {
  const { totalCount, scoredCount, activeProfile } = opts;

  return (
    SCOUT_SYSTEM_PROMPT +
    `\n\nYou currently have access to ${totalCount} federal contract opportunities in the database` +
    (scoredCount > 0
      ? `, ${scoredCount} of which have been AI-scored with fit recommendations.`
      : ".") +
    ` Use the provided tools to search for opportunities before answering. ` +
    `Always search first — do not guess or claim you have no data without searching. ` +
    `When users ask about pipeline, recommendations, or scoring, use the getScoredPipeline tool. ` +
    `For deadline-sensitive questions, use the deadlineMonitor tool.` +
    (activeProfile
      ? `\n\nThe active company profile is "${activeProfile.name}" targeting NAICS codes: ${activeProfile.targetNaics.join(", ")}.`
      : `\n\nNo company profile has been configured yet. If the user seems new or asks about getting started, offer to help them set up their company profile for opportunity matching.`)
  );
}
