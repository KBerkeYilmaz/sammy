// Shared types between apps/web and apps/pipeline

export type PipelineJobStatus = "pending" | "running" | "completed" | "failed";

export interface IngestJobPayload {
  postedFrom: string; // MM/DD/YYYY
  postedTo: string;   // MM/DD/YYYY
  naicsCode?: string;
  limit?: number;
}

export interface EmbedJobPayload {
  opportunityId: string;
  content: string;
}

export interface ScoreJobPayload {
  opportunityId: string;
  profileId: string;
}

export type WebhookEvent =
  | "ingest.complete"
  | "score.complete"
  | "embed.complete";

export interface WebhookPayload {
  event: WebhookEvent;
  jobId: string;
  status: PipelineJobStatus;
  data?: unknown;
}

export interface PipelineJobResult {
  jobId: string;
  status: PipelineJobStatus;
  message: string;
}
