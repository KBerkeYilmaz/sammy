import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { SCOUT_SYSTEM_PROMPT } from "~/server/prompts";
import { chatModel } from "~/server/bedrock";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json() as { messages: UIMessage[] };

  // TODO: Phase 2 — before calling streamText, embed the last user message,
  // run vector similarity search against OpportunityChunk, and inject
  // retrieved context into the system prompt.

  const result = streamText({
    model: chatModel,
    system: SCOUT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
