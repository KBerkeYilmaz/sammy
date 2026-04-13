import type { Prisma, PrismaClient } from "@prisma/client";

/** Get all scoring profile IDs belonging to a user */
export async function getUserProfileIds(db: PrismaClient, userId: string) {
  const profiles = await db.scoringProfile.findMany({
    where: { userId },
    select: { id: true },
  });
  return profiles.map((p) => p.id);
}

/** Reusable Prisma select objects for Opportunity queries across tools and routers */

export const opportunitySelectBasic = {
  title: true,
  department: true,
  solicitationNumber: true,
} as const satisfies Prisma.OpportunitySelect;

export const opportunitySelectSummary = {
  title: true,
  department: true,
  naicsCode: true,
  type: true,
  solicitationNumber: true,
  responseDeadline: true,
  postedDate: true,
} as const satisfies Prisma.OpportunitySelect;

export const opportunitySelectDetail = {
  title: true,
  solicitationNumber: true,
  department: true,
  subTier: true,
  type: true,
  naicsCode: true,
  postedDate: true,
  responseDeadline: true,
  active: true,
  contactName: true,
  contactEmail: true,
  state: true,
  noticeId: true,
} as const satisfies Prisma.OpportunitySelect;

export const opportunitySelectFilter = {
  title: true,
  solicitationNumber: true,
  department: true,
  type: true,
  naicsCode: true,
  postedDate: true,
  responseDeadline: true,
  active: true,
  state: true,
} as const satisfies Prisma.OpportunitySelect;
