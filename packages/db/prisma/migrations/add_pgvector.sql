-- Run this AFTER pnpm db:push to add the pgvector embedding column.
-- Neon supports pgvector natively — just enable the extension.
--
-- Usage: psql $DATABASE_URL -f prisma/migrations/add_pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "OpportunityChunk"
  ADD COLUMN IF NOT EXISTS embedding vector(1024);

CREATE INDEX IF NOT EXISTS opportunity_chunk_embedding_idx
  ON "OpportunityChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
