import { embed } from "ai";
import { db } from "~/server/db";
import { embeddingModel } from "~/server/bedrock";

export interface ChunkResult {
  id: string;
  content: string;
  metadata: unknown;
  similarity: number;
}

/**
 * Embed a query string and return the top-K most similar opportunity chunks
 * via pgvector cosine similarity.
 */
export async function semanticSearch(
  query: string,
  topK = 15,
): Promise<ChunkResult[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
    providerOptions: {
      bedrock: { dimensions: 1024, normalize: true },
    },
  });

  const vector = `[${embedding.join(",")}]`;

  return db.$queryRaw<ChunkResult[]>`
    SELECT
      id,
      content,
      metadata,
      1 - (embedding <=> ${vector}::vector) AS similarity
    FROM "OpportunityChunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${topK}
  `;
}

/**
 * Return total opportunity count for system prompt context.
 */
export async function getOpportunityCount(): Promise<number> {
  return db.opportunity.count();
}

/**
 * Format retrieved chunks into a context block for injection into the system prompt.
 */
export function formatChunks(chunks: ChunkResult[]): string {
  if (chunks.length === 0) return "No matching opportunities found.";
  return chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n");
}
