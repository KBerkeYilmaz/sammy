/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
if (!process.env.SKIP_ENV_VALIDATION) {
  await import("./src/env.js");
}
import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  reactCompiler: true,
  // pg leaks into browser module analysis via: trpc/react.tsx → root.ts → trpc.ts → db.ts → pg
  // The type-only import chain still causes the bundler to resolve pg's Node.js built-ins.
  // These stubs prevent browser build failures — pg is never actually called client-side.
  // See: https://nextjs.org/docs/app/guides/upgrading/version-16#resolve-alias-fallback
  turbopack: {
    resolveAlias: {
      dns: { browser: "./src/empty.ts" },
      net: { browser: "./src/empty.ts" },
      tls: { browser: "./src/empty.ts" },
      fs: { browser: "./src/empty.ts" },
    },
  },
  output: "standalone",
  // Required for Docker standalone builds — includes workspace packages in trace
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.sam.gov",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default config;
