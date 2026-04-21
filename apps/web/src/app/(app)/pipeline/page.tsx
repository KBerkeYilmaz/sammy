import { api, HydrateClient } from "~/trpc/server";
import { PipelineDashboard } from "./_components/pipeline-dashboard";

export type { ScoredItem } from "./_components/pipeline-dashboard";

export default async function PipelinePage() {
  void api.pipeline.getPipeline.prefetch();

  return (
    <HydrateClient>
      <PipelineDashboard />
    </HydrateClient>
  );
}
