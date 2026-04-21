import type { Request, Response } from "express";
import type { WebhookPayload } from "@sammy/types";

// Receives completion events from n8n
export function webhookHandler(
  req: Request<unknown, { received: boolean }, WebhookPayload>,
  res: Response<{ received: boolean }>,
): void {
  const { event, jobId, status, data } = req.body;
  console.log("[webhook] received", { event, jobId, status, data });
  res.json({ received: true });
}
