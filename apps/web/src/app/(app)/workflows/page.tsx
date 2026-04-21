import { api, HydrateClient } from "~/trpc/server";
import { WorkflowsDashboard } from "./_components/workflows-dashboard";

export default async function WorkflowsPage() {
  void api.workflows.list.prefetch();

  return (
    <HydrateClient>
      <WorkflowsDashboard />
    </HydrateClient>
  );
}
