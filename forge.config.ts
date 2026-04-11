import { defineConfig } from "~/lib/forge";

export default defineConfig({
  database: {
    adapter: "postgres",
  },
  animations: {
    default: "motion",
  },
  // storage: { enabled: false, adapter: "r2" },
  // jobs: { adapter: "inngest" },
});
