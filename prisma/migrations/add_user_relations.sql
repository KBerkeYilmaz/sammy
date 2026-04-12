-- Phase 3: Add userId to ChatSession and ScoringProfile
-- Run: npx prisma db execute --file prisma/migrations/add_user_relations.sql

ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "ScoringProfile" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "user"("id") ON DELETE CASCADE;
