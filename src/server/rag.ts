import { embed } from "ai";
import { db } from "~/server/db";
import { embeddingModel } from "~/server/bedrock";

interface ChunkResult {
  id: string;
  content: string;
  metadata: unknown;
  similarity: number;
}

/**
 * Embed a query string and return the top-K most similar opportunity chunks.
 */
export async function retrieveContext(
  query: string,
  topK = 8,
): Promise<ChunkResult[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
    providerOptions: {
      bedrock: { dimensions: 1024, normalize: true },
    },
  });

  const vector = `[${embedding.join(",")}]`;

  const rows = await db.$queryRaw<ChunkResult[]>`
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

  return rows;
}

/**
 * Format retrieved chunks into a context block for injection into the system prompt.
 */
export function buildContextBlock(chunks: ChunkResult[]): string {
  if (chunks.length === 0) return "";

  const items = chunks
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join("\n");

  return `\n\nRelevant opportunities from the database (use these to ground your answer):\n${items}`;
}
