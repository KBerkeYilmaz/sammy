import { api, HydrateClient } from "~/trpc/server";
import { OpportunityExplorer } from "./_components/opportunity-explorer";

export const metadata = {
  title: "Explore — Sammy",
  description: "Browse and filter federal contract opportunities from SAM.gov",
};

export default async function ExplorePage() {
  void api.opportunities.list.prefetch({ limit: 20, offset: 0 });

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <OpportunityExplorer />
      </div>
    </HydrateClient>
  );
}
