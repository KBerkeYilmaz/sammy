import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL, ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [])],
  advanced: {
    // Traefik terminates SSL and forwards as HTTP internally.
    // useSecureCookies ensures the Secure flag is set even though the
    // internal request arrives over HTTP.
    useSecureCookies: true,
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      isOnboarded: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
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
