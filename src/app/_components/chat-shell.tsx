"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatShell() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
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

  return (
    <div className="flex flex-1 flex-col h-screen max-w-3xl mx-auto w-full p-4">
      <header className="py-4 border-b mb-4">
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="text-sm text-muted-foreground">
          Government contracting intelligence
        </p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-16">
            Ask about federal contract opportunities
          </p>
        )}

        {messages.map((message: UIMessage) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[75%] text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                        {part.text}
                      </ReactMarkdown>
                    ) : null,
                  )}
                </div>
              ) : (
                message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i}>{part.text}</span>
                  ) : null,
                )
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator — shown when submitted but no assistant text yet */}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <ThinkingDots />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none overflow-hidden min-h-[38px] max-h-40"
          placeholder="Ask about opportunities, agencies, deadlines..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-[38px] shrink-0"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Spinner />
              Sending
            </span>
          ) : (
            "Send"
          )}
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-1.5 text-center">
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
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
