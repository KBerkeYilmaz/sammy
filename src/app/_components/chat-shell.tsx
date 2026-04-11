"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SidebarTrigger } from "~/components/ui/sidebar";

const SUGGESTED_PROMPTS = [
  "Show me active DoD solicitations closing this week",
  "Which agencies have the most open IT contracts?",
  "Find cybersecurity opportunities under NAICS 541519",
  "Summarize recent award notices over $10M",
];

export function ChatShell() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage({ text: input });
      setInput("");
    }
  }

  function handleSuggestedPrompt(prompt: string) {
    if (isLoading) return;
    sendMessage({ text: prompt });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold">Chat</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPrompt={handleSuggestedPrompt} isLoading={isLoading} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="font-medium">Error:</span> {error.message}
              </div>
            )}

            {messages.map((message: UIMessage) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-3">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring min-h-[40px] max-h-36"
            placeholder="Ask about opportunities, agencies, deadlines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="size-10 shrink-0"
          >
            {isLoading ? <Spinner /> : <ArrowUp className="size-4" />}
          </Button>
        </form>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-xs text-muted-foreground">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {isUser ? (
          message.parts.map((part, i) =>
            part.type === "text" ? <span key={i}>{part.text}</span> : null,
          )
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.parts.map((part, i) =>
              part.type === "text" ? (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onPrompt,
  isLoading,
}: {
  onPrompt: (p: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <span className="text-xl font-bold text-primary">S</span>
      </div>
      <h2 className="text-lg font-semibold">Sammy</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Federal contract intelligence powered by SAM.gov
      </p>

      <div className="w-full max-w-md space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            disabled={isLoading}
            className="w-full rounded-lg border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 22 8.954 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
