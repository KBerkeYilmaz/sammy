"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";

export function ChatShell() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status === "streaming") return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex flex-1 flex-col h-screen max-w-3xl mx-auto w-full p-4">
      <header className="py-4 border-b mb-4">
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="text-sm text-muted-foreground">
          Government contracting intelligence
        </p>
      </header>

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
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={i}>{part.text}</span>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ask about opportunities, agencies, deadlines..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status === "streaming"}
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={!input.trim() || status === "streaming"}
        >
          {status === "streaming" ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
