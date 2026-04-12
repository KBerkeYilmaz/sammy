import { HydrateClient } from "~/trpc/server";
import { OpportunityExplorer } from "./_components/opportunity-explorer";

export const metadata = {
  title: "Explore — Sammy",
  description: "Browse and filter federal contract opportunities from SAM.gov",
};

export default function ExplorePage() {
  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <OpportunityExplorer />
      </div>
    </HydrateClient>
  );
}
