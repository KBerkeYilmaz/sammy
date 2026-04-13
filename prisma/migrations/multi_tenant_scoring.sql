-- Multi-tenant scoring: allow per-profile scores and capture briefs
-- Run: psql $DATABASE_URL -f prisma/migrations/multi_tenant_scoring.sql

-- 1. OpportunityScore: drop single unique, add composite unique + FK to profile
ALTER TABLE "OpportunityScore" DROP CONSTRAINT IF EXISTS "OpportunityScore_opportunityId_key";
ALTER TABLE "OpportunityScore" ADD CONSTRAINT "OpportunityScore_opportunityId_profileId_key"
  UNIQUE ("opportunityId", "profileId");
ALTER TABLE "OpportunityScore" ADD CONSTRAINT "OpportunityScore_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "ScoringProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. CaptureBrief: add profileId, backfill, then constrain
ALTER TABLE "CaptureBrief" ADD COLUMN IF NOT EXISTS "profileId" TEXT;

UPDATE "CaptureBrief" cb
SET "profileId" = (
  SELECT os."profileId" FROM "OpportunityScore" os
  WHERE os."opportunityId" = cb."opportunityId"
  LIMIT 1
)
WHERE cb."profileId" IS NULL;

-- Delete orphaned briefs (no matching score to backfill from)
DELETE FROM "CaptureBrief" WHERE "profileId" IS NULL;

ALTER TABLE "CaptureBrief" ALTER COLUMN "profileId" SET NOT NULL;

ALTER TABLE "CaptureBrief" DROP CONSTRAINT IF EXISTS "CaptureBrief_opportunityId_key";
ALTER TABLE "CaptureBrief" ADD CONSTRAINT "CaptureBrief_opportunityId_profileId_key"
  UNIQUE ("opportunityId", "profileId");
ALTER TABLE "CaptureBrief" ADD CONSTRAINT "CaptureBrief_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "ScoringProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. WorkflowRun: add userId (from earlier data isolation fix)
ALTER TABLE "WorkflowRun" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
