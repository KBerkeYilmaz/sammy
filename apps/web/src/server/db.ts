import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Lazy init — browser bundle evaluates this module (via tRPC type chain)
// but DATABASE_URL won't exist there. Only create the client server-side.
export const db = globalForPrisma.prisma ?? (process.env.DATABASE_URL ? createPrismaClient() : (undefined as unknown as ReturnType<typeof createPrismaClient>));

if (process.env.NODE_ENV !== "production" && db) globalForPrisma.prisma = db;
