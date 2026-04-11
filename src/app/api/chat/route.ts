import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { SCOUT_SYSTEM_PROMPT } from "~/server/prompts";
import { chatModel } from "~/server/bedrock";
import { retrieveContext, buildContextBlock } from "~/server/rag";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  // Extract the latest user message text for retrieval
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const queryText =
    lastUserMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ") ?? "";

  // Retrieve relevant chunks and augment the system prompt
  const chunks = queryText ? await retrieveContext(queryText) : [];
  const system = SCOUT_SYSTEM_PROMPT + buildContextBlock(chunks);

  const result = streamText({
    model: chatModel,
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
