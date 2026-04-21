-- Add isOnboarded flag to User
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- Create Workflow table
CREATE TABLE IF NOT EXISTS "Workflow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- Mark existing users as onboarded (they already have profiles)
UPDATE "user" SET "isOnboarded" = true WHERE "id" IN (
  SELECT DISTINCT "userId" FROM "ScoringProfile" WHERE "userId" IS NOT NULL
);
