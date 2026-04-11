import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DATABASE_URL is required for db:push and db:migrate
    // Set it in your .env file (see .env.example)
    url: process.env.DATABASE_URL ?? "",
  },
});
