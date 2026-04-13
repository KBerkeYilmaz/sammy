import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { env } from "~/env";

const bedrockProvider = createAmazonBedrock({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

// Claude Sonnet via Bedrock — used for RAG chat generation
export const chatModel = bedrockProvider(
  "us.anthropic.claude-sonnet-4-6",
);

// Titan Embeddings v2 — used for embedding opportunities and queries
// Pass dimensions: 1024 via providerOptions at call time (embed/embedMany)
export const embeddingModel = bedrockProvider.embedding(
  "amazon.titan-embed-text-v2:0",
);
