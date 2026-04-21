/**
 * Seed a demo scoring profile for the cleat.ai interview.
 * Run: npx tsx prisma/seed-profile.ts
 *
 * This creates the scoring profile that the pipeline uses to evaluate
 * opportunities. The pipeline orchestrator also auto-creates this if
 * no active profile exists, but this script lets you reset it.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Deactivate any existing profiles
  await db.scoringProfile.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const profile = await db.scoringProfile.create({
    data: {
      name: "Demo GovCon Firm",
      isActive: true,
      targetNaics: ["541512", "541519", "541511", "541330", "518210"],
      targetDepartments: [
        "DEPARTMENT OF DEFENSE",
        "DEPARTMENT OF HOMELAND SECURITY",
        "DEPARTMENT OF VETERANS AFFAIRS",
      ],
      preferredSetAsides: ["SBA", "Total Small Business"],
      keywords: [
        "cybersecurity",
        "cloud",
        "artificial intelligence",
        "software development",
        "data analytics",
        "IT modernization",
      ],
      minContractValue: 100000,
    },
  });

  console.log(`Created scoring profile: ${profile.id} (${profile.name})`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
