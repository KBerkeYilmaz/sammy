import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      new URL(env.NEXT_PUBLIC_APP_URL).host,
      "*.vercel.app",
    ],
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL, "https://*.vercel.app"],
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  ...(env.BETTER_AUTH_GITHUB_CLIENT_ID && env.BETTER_AUTH_GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
            clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
            redirectURI: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`,
          },
        },
      }
    : {}),
});

export type Session = typeof auth.$Infer.Session;
