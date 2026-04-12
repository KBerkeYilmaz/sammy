-- Phase 2: Agentic Automation Layer
-- Creates 4 new tables for scoring, capture briefs, and workflow tracking.
-- Run: psql $DATABASE_URL -f prisma/migrations/add_phase2_models.sql

CREATE TABLE IF NOT EXISTS "ScoringProfile" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"               TEXT NOT NULL,
  "isActive"           BOOLEAN NOT NULL DEFAULT true,
  "targetNaics"        JSONB NOT NULL,
  "targetDepartments"  JSONB NOT NULL,
  "preferredSetAsides" JSONB NOT NULL,
  "keywords"           JSONB NOT NULL,
  "minContractValue"   DOUBLE PRECISION,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoringProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OpportunityScore" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "opportunityId"  TEXT NOT NULL,
  "fitScore"       INTEGER NOT NULL,
  "recommendation" TEXT NOT NULL,
  "rationale"      TEXT NOT NULL,
  "keyStrengths"   JSONB NOT NULL,
  "risks"          JSONB NOT NULL,
  "profileId"      TEXT NOT NULL,
  "scoredAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityScore_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OpportunityScore_opportunityId_key" UNIQUE ("opportunityId"),
  CONSTRAINT "OpportunityScore_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CaptureBrief" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "opportunityId"   TEXT NOT NULL,
  "summary"         TEXT NOT NULL,
  "keyRequirements" JSONB NOT NULL,
  "competitiveEdge" TEXT NOT NULL,
  "suggestedTeam"   JSONB NOT NULL,
  "timeline"        TEXT NOT NULL,
  "generatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaptureBrief_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CaptureBrief_opportunityId_key" UNIQUE ("opportunityId"),
  CONSTRAINT "CaptureBrief_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WorkflowRun" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type"                   TEXT NOT NULL,
  "status"                 TEXT NOT NULL,
  "opportunitiesProcessed" INTEGER NOT NULL DEFAULT 0,
  "results"                JSONB NOT NULL,
  "errors"                 JSONB,
  "startedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"            TIMESTAMP(3),
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);
