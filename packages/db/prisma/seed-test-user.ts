/**
 * Seed a demo test user and assign all existing data to them.
 * Run: npx tsx prisma/seed-test-user.ts
 *
 * Creates:
 * - User: demo@sammy.dev / sammy-demo-2026
 * - Assigns all existing ScoringProfile + ChatSession records to this user
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@sammy.dev";
const DEMO_NAME = "Demo User";

async function main() {
  // Check if user already exists
  let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    // Use Better Auth's server-side signUp API to create the user properly.
    // We dynamically import the auth config which handles password hashing
    // and creates both User + Account records.
    const { betterAuth } = await import("better-auth");
    const { prismaAdapter } = await import("better-auth/adapters/prisma");

    const auth = betterAuth({
      baseURL: "http://localhost:3000",
      database: prismaAdapter(db, { provider: "postgresql" }),
      emailAndPassword: { enabled: true },
    });

    const result = await auth.api.signUpEmail({
      body: {
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: "sammy-demo-2026",
      },
    });

    if (!result.user) {
      throw new Error("Failed to create demo user");
    }

    user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!user) throw new Error("User created but not found in DB");

    console.log(`Created demo user: ${user.id} (${DEMO_EMAIL})`);
  } else {
    console.log(`Demo user already exists: ${user.id} (${DEMO_EMAIL})`);
  }

  // Assign all orphaned ScoringProfiles to this user
  const profileResult = await db.scoringProfile.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log(`Assigned ${profileResult.count} scoring profiles to demo user`);

  // Assign all orphaned ChatSessions to this user
  const sessionResult = await db.chatSession.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log(`Assigned ${sessionResult.count} chat sessions to demo user`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
