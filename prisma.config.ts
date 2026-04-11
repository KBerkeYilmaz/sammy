import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL used for migrations (session pooler, port 5432)
    // DATABASE_URL used for app queries (transaction pooler, port 6543)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
