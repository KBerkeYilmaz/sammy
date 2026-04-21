import type { Request, Response } from "express";
import type { EmbedJobPayload, PipelineJobResult } from "@sammy/types";

// TODO: Wire to Bedrock embedding (tomorrow)
export function embedHandler(
  req: Request<unknown, PipelineJobResult, EmbedJobPayload>,
  res: Response<PipelineJobResult>,
): void {
  const { opportunityId, content } = req.body;
  console.log("[embed] triggered", { opportunityId, contentLength: content.length });
  res.json({
    jobId: crypto.randomUUID(),
    status: "pending",
    message: "Embed job queued (not yet implemented)",
  });
}
