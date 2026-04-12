"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";

export default function BriefsPage() {
  const briefs = api.workflow.getCaptureBriefs.useQuery();

  if (briefs.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading capture briefs...
      </div>
    );
  }

  if (!briefs.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No capture briefs yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Run the pipeline — briefs are auto-generated for &ldquo;pursue&rdquo; opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 space-y-4">
      <h2 className="text-lg font-semibold">
        Capture Briefs{" "}
        <Badge variant="secondary" className="ml-2 text-xs">
          {briefs.data.length}
        </Badge>
      </h2>
      <div className="space-y-3">
        {briefs.data.map((brief) => (
          <BriefCard key={brief.id} brief={brief} />
        ))}
      </div>
    </div>
  );
}

type Brief = {
  id: string;
  summary: string;
  keyRequirements: unknown;
  competitiveEdge: string;
  suggestedTeam: unknown;
  timeline: string;
  generatedAt: Date;
  opportunity: {
    title: string;
    department: string;
    solicitationNumber: string | null;
  };
};

function BriefCard({ brief }: { brief: Brief }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{brief.opportunity.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {brief.opportunity.department}
            {brief.opportunity.solicitationNumber && (
              <> &middot; {brief.opportunity.solicitationNumber}</>
            )}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4 text-sm">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Executive Summary
            </h4>
            <p className="text-muted-foreground leading-relaxed">{brief.summary}</p>
          </div>

          {Array.isArray(brief.keyRequirements) && (brief.keyRequirements as string[]).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Key Requirements
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {(brief.keyRequirements as string[]).map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Competitive Edge
            </h4>
            <p className="text-muted-foreground">{brief.competitiveEdge}</p>
          </div>

          {Array.isArray(brief.suggestedTeam) && (brief.suggestedTeam as string[]).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Suggested Team
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(brief.suggestedTeam as string[]).map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Timeline
            </h4>
            <p className="text-muted-foreground">{brief.timeline}</p>
          </div>
        </div>
      )}
    </div>
  );
}
