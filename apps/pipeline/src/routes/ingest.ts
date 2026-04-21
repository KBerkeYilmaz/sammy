import type { Request, Response } from "express";
import type { IngestJobPayload, PipelineJobResult } from "@sammy/types";

// TODO: Wire to n8n webhook trigger (tomorrow)
export function ingestHandler(
  req: Request<unknown, PipelineJobResult, IngestJobPayload>,
  res: Response<PipelineJobResult>,
): void {
  const { postedFrom, postedTo, naicsCode, limit } = req.body;
  console.log("[ingest] triggered", { postedFrom, postedTo, naicsCode, limit });
  res.json({
    jobId: crypto.randomUUID(),
    status: "pending",
    message: "Ingest job queued (not yet implemented)",
  });
}
