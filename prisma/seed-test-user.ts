/**
 * Seed a demo test user and assign all existing data to them.
 * Run: npx tsx prisma/seed-test-user.ts
 *
 * Creates:
 * - User: demo@sammy.dev / sammy-demo-2026
 * - Assigns all existing ScoringProfile + ChatSession records to this user
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@sammy.dev";
const DEMO_NAME = "Demo User";

async function main() {
  // Check if user already exists
  let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    // Create user via direct Prisma insert — Better Auth stores the
    // password hash in the Account table with providerId: "credential".
    // We use the crypto API to hash with bcrypt-compatible scrypt since
    // better-auth uses its own hashing internally. Instead, we'll create
    // the user record and let them sign up via the UI on first use.
    // For the seed, we create the user + account using better-auth's
    // server-side signUp API.

    // Import the auth instance to use its internal API
    const { auth } = await import("../src/server/better-auth/config");

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
