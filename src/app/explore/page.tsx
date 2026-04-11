import { HydrateClient } from "~/trpc/server";
import { OpportunityExplorer } from "./_components/opportunity-explorer";

export const metadata = {
  title: "Opportunity Explorer — Sammy",
  description: "Browse and filter federal contract opportunities from SAM.gov",
};

export default function ExplorePage() {
  return (
    <HydrateClient>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Opportunity Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and filter {" "}
            <span className="font-medium text-foreground">SAM.gov</span> federal contract
            opportunities. Click any row to see full details.
          </p>
        </div>
        <OpportunityExplorer />
      </main>
    </HydrateClient>
  );
}
