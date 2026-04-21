import type { Request, Response } from "express";
import type { ScoreJobPayload, PipelineJobResult } from "@sammy/types";

// TODO: Wire to scoring logic (tomorrow)
export function scoreHandler(
  req: Request<unknown, PipelineJobResult, ScoreJobPayload>,
  res: Response<PipelineJobResult>,
): void {
  const { opportunityId, profileId } = req.body;
  console.log("[score] triggered", { opportunityId, profileId });
  res.json({
    jobId: crypto.randomUUID(),
    status: "pending",
    message: "Score job queued (not yet implemented)",
  });
}
