export interface ForgeConfig {
  database?: {
    adapter: "postgres" | "mysql" | "sqlite" | "turso";
  };
  animations?: {
    default: "motion" | "none";
  };
  storage?: {
    enabled: boolean;
    adapter?: "r2" | "s3" | "local";
  };
  jobs?: {
    adapter: "inngest" | "trigger.dev";
  };
}

export function defineConfig(config: ForgeConfig): ForgeConfig {
  return config;
}
