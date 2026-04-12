import {
  convertToModelMessages,
  smoothStream,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { chatModel } from "~/server/bedrock";
import { getOpportunityCount } from "~/server/rag";
import { db } from "~/server/db";
import { auth } from "~/server/better-auth";
import { rateLimit } from "~/lib/rate-limit";
import { createTools } from "~/server/chat/tool-registry";
import { buildSystemPrompt } from "~/server/chat/system-prompt";

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

  const [totalCount, scoredCount, activeProfile] = await Promise.all([
    getOpportunityCount(),
    db.opportunityScore.count(),
    db.scoringProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
    }),
  ]);

  const system = buildSystemPrompt({
    totalCount,
    scoredCount,
    activeProfile: activeProfile
      ? {
          name: activeProfile.name,
          targetNaics: activeProfile.targetNaics as string[],
        }
      : null,
  });

  const result = streamText({
    model: chatModel,
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(7),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
    tools: createTools({ db, userId: session.user.id }),
  });

  return result.toUIMessageStreamResponse();
}
