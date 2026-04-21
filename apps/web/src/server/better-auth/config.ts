import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "~/server/db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// DEBUG: temporary hardcoded fallback to isolate the issue
const secret = process.env.BETTER_AUTH_SECRET ?? "REMOVE_ME_debug_fallback_secret_32chars_long!!";
console.log("[auth-debug] secret source:", process.env.BETTER_AUTH_SECRET ? "env" : "fallback", "len:", secret.length);

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins: [appUrl, ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [])],
  secret,
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
  ...(process.env.BETTER_AUTH_GITHUB_CLIENT_ID && process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
            clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
            redirectURI: `${appUrl}/api/auth/callback/github`,
          },
        },
      }
    : {}),
});

export type Session = typeof auth.$Infer.Session;
