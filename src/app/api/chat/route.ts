import {
  convertToModelMessages,
  generateObject,
  smoothStream,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { headers } from "next/headers";
import { SCOUT_SYSTEM_PROMPT } from "~/server/prompts";
import { chatModel } from "~/server/bedrock";
import { semanticSearch, formatChunks, getOpportunityCount } from "~/server/rag";
import { db } from "~/server/db";
import { auth } from "~/server/better-auth";
import { rateLimit } from "~/lib/rate-limit";

export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Rate limit: 20 messages per minute per user
  const { success } = rateLimit({
    key: `chat:${session.user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!success) {
    return new Response("Too many requests. Please wait a moment.", {
      status: 429,
    });
  }

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const totalCount = await getOpportunityCount();

  const scoredCount = await db.opportunityScore.count();

  const activeProfile = await db.scoringProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
  });

  const system =
    SCOUT_SYSTEM_PROMPT +
    `\n\nYou currently have access to ${totalCount} federal contract opportunities in the database` +
    (scoredCount > 0
      ? `, ${scoredCount} of which have been AI-scored with fit recommendations.`
      : ".") +
    ` Use the provided tools to search for opportunities before answering. ` +
    `Always search first — do not guess or claim you have no data without searching. ` +
    `When users ask about pipeline, recommendations, or scoring, use the getScoredPipeline tool. ` +
    `For deadline-sensitive questions, use the deadlineMonitor tool.` +
    (activeProfile
      ? `\n\nThe active company profile is "${activeProfile.name}" targeting NAICS codes: ${(activeProfile.targetNaics as string[]).join(", ")}.`
      : `\n\nNo company profile has been configured yet. If the user seems new or asks about getting started, offer to help them set up their company profile for opportunity matching.`);

  const result = streamText({
    model: chatModel,
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(7),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
    tools: {
      searchByKeyword: tool({
        description:
          "Search opportunities by keyword across title, solicitation number, department, NAICS code, or contact name. " +
          "Use this for specific lookups like solicitation numbers, agency names, or contract titles.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "Search term — a title, solicitation number, NAICS code, department, or keyword",
            ),
          limit: z.number().default(10).describe("Max results to return"),
        }),
        execute: async ({ query, limit }) => {
          const rows = await db.opportunity.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                {
                  solicitationNumber: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                { department: { contains: query, mode: "insensitive" } },
                { naicsCode: { contains: query, mode: "insensitive" } },
                { noticeId: { contains: query, mode: "insensitive" } },
                { contactName: { contains: query, mode: "insensitive" } },
                { subTier: { contains: query, mode: "insensitive" } },
              ],
            },
            take: limit,
            orderBy: { postedDate: "desc" },
            select: {
              title: true,
              solicitationNumber: true,
              department: true,
              subTier: true,
              type: true,
              naicsCode: true,
              postedDate: true,
              responseDeadline: true,
              active: true,
              contactName: true,
              contactEmail: true,
              state: true,
              noticeId: true,
            },
          });
          return { results: rows, count: rows.length };
        },
      }),

      searchBySemantic: tool({
        description:
          "Semantic search across opportunity descriptions using embeddings. " +
          "Use this for broad conceptual queries like 'cybersecurity contracts' or 'construction projects in California'.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Natural language search query"),
          limit: z.number().default(10).describe("Max results to return"),
        }),
        execute: async ({ query, limit }) => {
          const chunks = await semanticSearch(query, limit);
          return { results: formatChunks(chunks), count: chunks.length };
        },
      }),

      filterOpportunities: tool({
        description:
          "Filter opportunities by structured fields like department, type, NAICS code, or active status.",
        inputSchema: z.object({
          department: z
            .string()
            .optional()
            .describe("Department name (partial match)"),
          type: z
            .string()
            .optional()
            .describe(
              "Opportunity type: Solicitation, Award Notice, etc.",
            ),
          naicsCode: z.string().optional().describe("NAICS code"),
          activeOnly: z
            .boolean()
            .optional()
            .describe("Only return active opportunities"),
          limit: z.number().default(15).describe("Max results"),
        }),
        execute: async ({ department, type, naicsCode, activeOnly, limit }) => {
          const rows = await db.opportunity.findMany({
            where: {
              ...(department && {
                department: {
                  contains: department,
                  mode: "insensitive" as const,
                },
              }),
              ...(type && { type }),
              ...(naicsCode && { naicsCode }),
              ...(activeOnly && { active: true }),
            },
            take: limit,
            orderBy: { postedDate: "desc" },
            select: {
              title: true,
              solicitationNumber: true,
              department: true,
              type: true,
              naicsCode: true,
              postedDate: true,
              responseDeadline: true,
              active: true,
              state: true,
            },
          });
          return { results: rows, count: rows.length };
        },
      }),

      // ── Data Tools (pure Prisma queries) ──────────────────────────

      getScoredPipeline: tool({
        description:
          "Get AI-scored opportunities grouped by recommendation (pursue/watch/skip) with fit scores and rationale. " +
          "Use when users ask about pipeline, recommendations, what to pursue, or scored opportunities.",
        inputSchema: z.object({
          recommendation: z
            .enum(["pursue", "watch", "skip", "all"])
            .default("all")
            .describe("Filter by recommendation type"),
          minScore: z
            .number()
            .optional()
            .describe("Minimum fit score to include"),
        }),
        execute: async ({ recommendation, minScore }) => {
          const scored = await db.opportunityScore.findMany({
            where: {
              ...(recommendation !== "all" && { recommendation }),
              ...(minScore && { fitScore: { gte: minScore } }),
            },
            include: {
              opportunity: {
                select: {
                  title: true,
                  department: true,
                  naicsCode: true,
                  type: true,
                  solicitationNumber: true,
                  responseDeadline: true,
                  postedDate: true,
                },
              },
            },
            orderBy: { fitScore: "desc" },
            take: 20,
          });
          return { results: scored, count: scored.length };
        },
      }),

      getCaptureBrief: tool({
        description:
          "Get the auto-generated capture brief for a specific opportunity. " +
          "Use when users ask about a capture brief, strategy, or detailed analysis of a specific opportunity.",
        inputSchema: z.object({
          opportunityId: z.string().describe("The opportunity ID"),
        }),
        execute: async ({ opportunityId }) => {
          const brief = await db.captureBrief.findUnique({
            where: { opportunityId },
            include: {
              opportunity: {
                select: {
                  title: true,
                  department: true,
                  solicitationNumber: true,
                },
              },
            },
          });
          return brief ?? { error: "No capture brief found for this opportunity" };
        },
      }),

      deadlineMonitor: tool({
        description:
          "Find opportunities with approaching deadlines within N days, sorted by urgency. " +
          "Returns deadline, days remaining, fit score, and recommendation. " +
          "Use when users ask about upcoming deadlines, urgent opportunities, or time-sensitive items.",
        inputSchema: z.object({
          daysAhead: z
            .number()
            .default(30)
            .describe("Number of days to look ahead"),
          recommendation: z
            .enum(["pursue", "watch", "all"])
            .default("all")
            .describe("Filter by recommendation type"),
        }),
        execute: async ({ daysAhead, recommendation }) => {
          const now = new Date();
          const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

          const opps = await db.opportunity.findMany({
            where: {
              responseDeadline: { gte: now, lte: cutoff },
              ...(recommendation !== "all" && {
                score: { recommendation },
              }),
            },
            include: {
              score: {
                select: { fitScore: true, recommendation: true, rationale: true },
              },
            },
            orderBy: { responseDeadline: "asc" },
            take: 20,
          });

          return {
            results: opps.map((o) => ({
              title: o.title,
              department: o.department,
              solicitationNumber: o.solicitationNumber,
              responseDeadline: o.responseDeadline,
              daysRemaining: o.responseDeadline
                ? Math.ceil(
                    (o.responseDeadline.getTime() - now.getTime()) /
                      (24 * 60 * 60 * 1000),
                  )
                : null,
              score: o.score,
            })),
            count: opps.length,
          };
        },
      }),

      compareOpportunities: tool({
        description:
          "Side-by-side comparison of 2-3 opportunities analyzing fit score, requirements, timeline, contract value, and strategic recommendation. " +
          "Use when users want to compare specific opportunities.",
        inputSchema: z.object({
          opportunityIds: z
            .array(z.string())
            .min(2)
            .max(3)
            .describe("2-3 opportunity IDs to compare"),
        }),
        execute: async ({ opportunityIds }) => {
          const opps = await db.opportunity.findMany({
            where: { id: { in: opportunityIds } },
            include: {
              score: true,
              captureBrief: true,
            },
          });
          return { results: opps, count: opps.length };
        },
      }),

      // ── AI Tools (nested LLM calls via Bedrock) ──────────────────

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
- Set-aside: ${(opp.rawJson as Record<string, unknown>).typeOfSetAside ?? "N/A"}

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

          // Cross-reference: find past awardees in same NAICS/department
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
          opportunityId: z
            .string()
            .describe("The opportunity ID"),
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
          opportunityId: z
            .string()
            .describe("The opportunity ID"),
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

      // ── Workflow Builder Tool ────────────────────────────────────

      generate_workflow: tool({
        description:
          "Generate and save a visual workflow definition with nodes and edges. " +
          "Use when users ask to create, build, or generate an automation workflow. " +
          "Node types: trigger (start event), ai_action (AI processing step), condition (branching logic), action (output/notification). " +
          "Each node needs: id, type, data: { label, description }. " +
          "Each edge needs: id, source, target (and optional sourceHandle 'yes'/'no' for condition nodes).",
        inputSchema: z.object({
          name: z.string().describe("Workflow name"),
          description: z.string().optional().describe("Brief description"),
          nodes: z.array(
            z.object({
              id: z.string(),
              type: z.enum(["trigger", "ai_action", "condition", "action"]),
              data: z.object({
                label: z.string(),
                description: z.string().optional(),
              }),
            }),
          ),
          edges: z.array(
            z.object({
              id: z.string(),
              source: z.string(),
              target: z.string(),
              sourceHandle: z.string().optional(),
            }),
          ),
        }),
        execute: async ({ name, description, nodes, edges }) => {
          const workflow = await db.workflow.create({
            data: {
              name,
              description,
              nodes: nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
              edges,
              userId: session.user.id,
            },
          });
          return {
            workflowId: workflow.id,
            name: workflow.name,
            nodeCount: nodes.length,
            edgeCount: edges.length,
            message: `Workflow "${name}" saved with ${nodes.length} steps. View it at /workflows.`,
          };
        },
      }),

      // ── Onboarding Tool ──────────────────────────────────────────

      setup_company_profile: tool({
        description:
          "Create or update the company's scoring profile based on collected company information. " +
          "Call this when you have enough information about the user's company to build a meaningful scoring profile. " +
          "At minimum, you need the company name, target NAICS codes, and capability keywords.",
        inputSchema: z.object({
          companyName: z.string().describe("The company name"),
          targetNaics: z
            .array(z.string())
            .describe("Target NAICS codes the company operates under"),
          targetDepartments: z
            .array(z.string())
            .optional()
            .default([])
            .describe("Target federal departments/agencies"),
          preferredSetAsides: z
            .array(z.string())
            .optional()
            .default([])
            .describe("Set-aside eligibility types"),
          keywords: z
            .array(z.string())
            .describe("Keywords describing company capabilities"),
          minContractValue: z
            .number()
            .optional()
            .describe("Minimum contract value worth pursuing in USD"),
        }),
        execute: async ({
          companyName,
          targetNaics,
          targetDepartments,
          preferredSetAsides,
          keywords,
          minContractValue,
        }) => {
          // Deactivate existing profiles for this user
          await db.scoringProfile.updateMany({
            where: { userId: session.user.id, isActive: true },
            data: { isActive: false },
          });

          // Create new active profile
          const profile = await db.scoringProfile.create({
            data: {
              name: companyName,
              userId: session.user.id,
              isActive: true,
              targetNaics,
              targetDepartments,
              preferredSetAsides,
              keywords,
              minContractValue: minContractValue ?? null,
            },
          });

          const unscoredCount = await db.opportunity.count({
            where: { score: null },
          });

          return {
            profileId: profile.id,
            companyName: profile.name,
            message: `Company profile "${companyName}" created and set as active.`,
            unscoredOpportunities: unscoredCount,
            hint:
              unscoredCount > 0
                ? `There are ${unscoredCount} unscored opportunities. Would you like me to run the scoring pipeline against your new profile?`
                : "All opportunities have already been scored.",
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
