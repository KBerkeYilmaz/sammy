import { generateObject, tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { chatModel } from "~/server/bedrock";
import { parseSamJson } from "~/server/sam";

export function createAnalysisTools(db: PrismaClient) {
  return {
    analyzeRfp: tool({
      description:
        "Break down a government opportunity/solicitation into structured sections: key requirements, evaluation factors, compliance checklist, set-aside details, and submission requirements. " +
        "Use when users ask to analyze, break down, or review an RFP/solicitation.",
      inputSchema: z.object({
        opportunityId: z
          .string()
          .describe("The opportunity ID to analyze"),
      }),
      execute: async ({ opportunityId }) => {
        const opp = await db.opportunity.findUnique({
          where: { id: opportunityId },
          include: { score: true, chunks: { select: { content: true } } },
        });
        if (!opp) return { error: "Opportunity not found" };

        const chunkText = opp.chunks.map((c) => c.content).join("\n");
        const samData = parseSamJson(opp.rawJson);

        const { object } = await generateObject({
          model: chatModel,
          schema: z.object({
            keyRequirements: z.array(z.string()),
            evaluationFactors: z.array(z.string()),
            complianceChecklist: z.array(z.string()),
            setAsideDetails: z.string(),
            submissionRequirements: z.string(),
            summary: z.string(),
          }),
          prompt: `Analyze this federal opportunity and extract structured information.

OPPORTUNITY:
- Title: ${opp.title}
- Department: ${opp.department}
- Type: ${opp.type}
- NAICS: ${opp.naicsCode ?? "N/A"}
- Solicitation: ${opp.solicitationNumber ?? "N/A"}
- Set-aside: ${samData.typeOfSetAside ?? "N/A"}

ADDITIONAL CONTEXT:
${chunkText || "No additional text available."}

Extract: key requirements, evaluation factors, compliance checklist items, set-aside details, submission requirements, and a brief summary.`,
        });

        return { opportunity: opp.title, analysis: object };
      },
    }),

    competitiveLandscape: tool({
      description:
        "Analyze the competitive landscape for an opportunity: identify likely competitors from past award data, suggest differentiators, and flag teaming opportunities. " +
        "Use when users ask about competition, competitors, or competitive strategy.",
      inputSchema: z.object({
        opportunityId: z
          .string()
          .describe("The opportunity ID to analyze"),
      }),
      execute: async ({ opportunityId }) => {
        const opp = await db.opportunity.findUnique({
          where: { id: opportunityId },
          include: { score: true },
        });
        if (!opp) return { error: "Opportunity not found" };

        const relatedAwards = await db.opportunity.findMany({
          where: {
            department: opp.department,
            awardeeName: { not: null },
            type: { contains: "Award", mode: "insensitive" },
          },
          select: {
            title: true,
            awardeeName: true,
            awardAmount: true,
            naicsCode: true,
          },
          take: 15,
        });

        const { object } = await generateObject({
          model: chatModel,
          schema: z.object({
            likelyCompetitors: z.array(
              z.object({ name: z.string(), reasoning: z.string() }),
            ),
            differentiators: z.array(z.string()),
            teamingOpportunities: z.array(z.string()),
            winStrategy: z.string(),
          }),
          prompt: `Analyze the competitive landscape for this federal opportunity.

OPPORTUNITY:
- Title: ${opp.title}
- Department: ${opp.department}
- NAICS: ${opp.naicsCode ?? "N/A"}
- Type: ${opp.type}

PAST AWARDS IN SAME DEPARTMENT:
${relatedAwards.map((a) => `- ${a.awardeeName}: ${a.title} (${a.naicsCode}, $${a.awardAmount?.toLocaleString() ?? "N/A"})`).join("\n") || "No past award data available."}

Based on this data, identify likely competitors, suggest differentiators, flag teaming opportunities, and recommend a win strategy.`,
        });

        return { opportunity: opp.title, landscape: object };
      },
    }),

    generateComplianceMatrix: tool({
      description:
        "Generate a compliance requirements matrix for an opportunity, listing each requirement with status (met/unmet/partial) and evidence needed. " +
        "Use when users ask for compliance matrix, requirements tracking, or compliance review.",
      inputSchema: z.object({
        opportunityId: z.string().describe("The opportunity ID"),
      }),
      execute: async ({ opportunityId }) => {
        const opp = await db.opportunity.findUnique({
          where: { id: opportunityId },
          include: { score: true, chunks: { select: { content: true } } },
        });
        if (!opp) return { error: "Opportunity not found" };

        const chunkText = opp.chunks.map((c) => c.content).join("\n");

        const { object } = await generateObject({
          model: chatModel,
          schema: z.object({
            matrix: z.array(
              z.object({
                requirement: z.string(),
                status: z.enum(["met", "unmet", "partial", "unknown"]),
                evidenceNeeded: z.string(),
                priority: z.enum(["high", "medium", "low"]),
              }),
            ),
            overallReadiness: z.string(),
          }),
          prompt: `Generate a compliance requirements matrix for this federal opportunity.

OPPORTUNITY:
- Title: ${opp.title}
- Department: ${opp.department}
- Type: ${opp.type}
- NAICS: ${opp.naicsCode ?? "N/A"}

ADDITIONAL CONTEXT:
${chunkText || "No additional text available."}

For each identifiable requirement, assess compliance status from a typical small business GovCon perspective, note what evidence would be needed, and assign priority. Provide an overall readiness assessment.`,
        });

        return { opportunity: opp.title, compliance: object };
      },
    }),

    draftProposalOutline: tool({
      description:
        "Generate a proposal outline for an opportunity including executive summary draft, technical approach structure, management approach, and past performance section guidance. " +
        "Use when users ask to draft a proposal, create a proposal outline, or start proposal writing.",
      inputSchema: z.object({
        opportunityId: z.string().describe("The opportunity ID"),
      }),
      execute: async ({ opportunityId }) => {
        const opp = await db.opportunity.findUnique({
          where: { id: opportunityId },
          include: {
            score: true,
            captureBrief: true,
            chunks: { select: { content: true } },
          },
        });
        if (!opp) return { error: "Opportunity not found" };

        const { object } = await generateObject({
          model: chatModel,
          schema: z.object({
            executiveSummary: z.string(),
            technicalApproach: z.array(
              z.object({ section: z.string(), content: z.string() }),
            ),
            managementApproach: z.string(),
            pastPerformance: z.string(),
            keyPersonnel: z.array(z.string()),
            pricingStrategy: z.string(),
          }),
          prompt: `Draft a proposal outline for this federal opportunity.

OPPORTUNITY:
- Title: ${opp.title}
- Department: ${opp.department}
- Type: ${opp.type}
- NAICS: ${opp.naicsCode ?? "N/A"}
- Solicitation: ${opp.solicitationNumber ?? "N/A"}

${opp.score ? `AI SCORING:\n- Fit: ${opp.score.fitScore}/100\n- Strengths: ${JSON.stringify(opp.score.keyStrengths)}\n- Risks: ${JSON.stringify(opp.score.risks)}` : ""}

${opp.captureBrief ? `CAPTURE BRIEF:\n- Summary: ${opp.captureBrief.summary}\n- Competitive Edge: ${opp.captureBrief.competitiveEdge}` : ""}

Create a complete proposal outline with: executive summary draft, technical approach sections, management approach, past performance guidance, key personnel roles, and pricing strategy notes.`,
        });

        return { opportunity: opp.title, proposal: object };
      },
    }),
  };
}
