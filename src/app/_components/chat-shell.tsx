"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, AlertTriangle, Hexagon } from "lucide-react";

// ── Suggested prompts shown in empty state ─────────────────────────────────
const SUGGESTED_PROMPTS = [
  "Show me active DoD solicitations closing this week",
  "Which agencies have the most open IT contracts?",
  "Find cybersecurity opportunities under NAICS 541519",
  "Summarize recent award notices over $10M",
];

// ── Main component ──────────────────────────────────────────────────────────
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

  function handleSuggestedPrompt(prompt: string) {
    if (isLoading) return;
    sendMessage({ text: prompt });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-89px)]">
      {/* ── Main layout ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — system info */}
        <aside className="hidden lg:flex w-52 flex-col border-r border-border bg-[oklch(0.10_0.007_250)] shrink-0">
          <div className="p-4 border-b border-border">
            <div className="scout-label mb-2">System Status</div>
            <div className="space-y-2">
              <StatusRow label="RAG Pipeline" value="ONLINE" positive />
              <StatusRow label="Bedrock" value="ACTIVE" positive />
              <StatusRow label="pgvector" value="READY" positive />
              <StatusRow label="SAM.gov" value="CACHED" neutral />
            </div>
          </div>
          <div className="p-4 border-b border-border">
            <div className="scout-label mb-2">Session</div>
            <div className="space-y-2">
              <StatusRow label="Model" value="Claude 3.7" neutral />
              <StatusRow label="Mode" value="RAG+Chat" neutral />
              <StatusRow
                label="Messages"
                value={String(messages.length)}
                neutral
              />
            </div>
          </div>
          <div className="p-4 flex-1">
            <div className="scout-label mb-2">Instructions</div>
            <p className="text-[10px] font-mono text-[oklch(0.38_0.008_250)] leading-relaxed">
              Scout searches your embedded opportunity database and answers with
              cited sources. Ask about agencies, NAICS codes, deadlines, and
              contract types.
            </p>
          </div>
        </aside>

        {/* ── Chat area ────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Messages pane */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyState onPrompt={handleSuggestedPrompt} isLoading={isLoading} />
            ) : (
              <div className="px-4 py-6 space-y-0 max-w-4xl mx-auto">
                {/* Error banner */}
                {error && (
                  <div className="mb-4 flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/8 px-4 py-3">
                    <AlertTriangle className="size-4 mt-0.5 text-destructive shrink-0" />
                    <div>
                      <div className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider mb-0.5">
                        Error
                      </div>
                      <p className="text-sm text-destructive/80">{error.message}</p>
                    </div>
                  </div>
                )}

                {messages.map((message: UIMessage, idx: number) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLast={idx === messages.length - 1}
                  />
                ))}

                {/* Thinking indicator */}
                {status === "submitted" && (
                  <div className="flex gap-3 py-4 animate-slide-right">
                    <div className="size-7 rounded-sm bg-[oklch(0.78_0.14_68/0.12)] border border-[oklch(0.78_0.14_68/0.3)] flex items-center justify-center shrink-0 mt-0.5">
                      <Hexagon className="size-3.5 text-[oklch(0.78_0.14_68)]" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="scout-label mb-2">SCOUT</div>
                      <div className="flex items-center gap-1.5">
                        <ThinkingDots />
                        <span className="text-xs font-mono text-muted-foreground">
                          Searching intelligence database…
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── Input bar ──────────────────────────────────── */}
          <div className="border-t border-border bg-[oklch(0.10_0.007_250)] p-4">
            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto flex gap-3 items-end"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="w-full bg-[oklch(0.13_0.007_250)] border border-border rounded-sm px-4 py-3 text-sm font-mono text-foreground placeholder:text-[oklch(0.35_0.008_250)] outline-none focus:border-[oklch(0.78_0.14_68/0.5)] focus:ring-1 focus:ring-[oklch(0.78_0.14_68/0.3)] resize-none overflow-hidden min-h-[44px] max-h-36 transition-colors"
                  placeholder="Query the intelligence database…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="size-11 rounded-sm bg-[oklch(0.78_0.14_68)] hover:bg-[oklch(0.82_0.14_68)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 group"
              >
                {isLoading ? (
                  <Spinner />
                ) : (
                  <ArrowUp className="size-4 text-[oklch(0.09_0.008_250)] group-hover:scale-110 transition-transform" />
                )}
              </button>
            </form>
            <div className="max-w-4xl mx-auto mt-2 flex items-center gap-4">
              <p className="text-[10px] font-mono text-[oklch(0.32_0.008_250)] tracking-wider">
                ⏎ SEND · ⇧⏎ NEW LINE
              </p>
              <div className="flex-1 h-px bg-border" />
              <p className="text-[10px] font-mono text-[oklch(0.32_0.008_250)] tracking-wider">
                GROUNDED IN SAM.GOV DATA
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isLast,
}: {
  message: UIMessage;
  isLast: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end py-3 animate-slide-up">
        <div className="max-w-[75%] min-w-0">
          <div className="text-[10px] font-mono tracking-widest uppercase text-right text-[oklch(0.38_0.008_250)] mb-1.5">
            OPERATOR
          </div>
          <div className="bg-[oklch(0.78_0.14_68/0.12)] border border-[oklch(0.78_0.14_68/0.25)] rounded-sm px-4 py-2.5 text-sm text-[oklch(0.88_0.006_80)]">
            {message.parts.map((part, i) =>
              part.type === "text" ? (
                <span key={i} className="font-mono leading-relaxed">
                  {part.text}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 py-4 ${isLast ? "animate-slide-right" : ""} border-b border-border/30 last:border-0`}
    >
      {/* Scout icon */}
      <div className="size-7 rounded-sm bg-[oklch(0.78_0.14_68/0.12)] border border-[oklch(0.78_0.14_68/0.3)] flex items-center justify-center shrink-0 mt-0.5">
        <Hexagon className="size-3.5 text-[oklch(0.78_0.14_68)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="scout-label mb-2">SCOUT</div>
        <div className="scout-prose text-sm">
          {message.parts.map((part, i) =>
            part.type === "text" ? (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({
  onPrompt,
  isLoading,
}: {
  onPrompt: (p: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full px-4 py-16">
      {/* Hero mark */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 blur-2xl bg-[oklch(0.78_0.14_68/0.15)] rounded-full scale-150" />
        <div className="relative size-16 flex items-center justify-center">
          <svg viewBox="0 0 64 64" fill="none" className="size-16">
            <polygon
              points="32,4 60,18 60,46 32,60 4,46 4,18"
              stroke="oklch(0.78 0.14 68)"
              strokeWidth="1.5"
              fill="oklch(0.78 0.14 68 / 0.06)"
            />
            <polygon
              points="32,14 50,24 50,40 32,50 14,40 14,24"
              fill="oklch(0.78 0.14 68 / 0.12)"
              stroke="oklch(0.78 0.14 68 / 0.5)"
              strokeWidth="1"
            />
            <circle cx="32" cy="32" r="6" fill="oklch(0.78 0.14 68)" />
          </svg>
        </div>
      </div>

      <div
        className="text-2xl font-bold tracking-[0.2em] uppercase text-[oklch(0.78_0.14_68)] mb-1"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        SCOUT
      </div>
      <p className="text-xs font-mono tracking-widest text-[oklch(0.40_0.008_250)] uppercase mb-2">
        Federal Contract Intelligence
      </p>
      <div className="flex items-center gap-2 mb-10">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[oklch(0.78_0.14_68/0.4)]" />
        <div className="scout-status-live text-[10px] tracking-widest">
          READY
        </div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[oklch(0.78_0.14_68/0.4)]" />
      </div>

      {/* Suggested prompts */}
      <div className="w-full max-w-lg space-y-2 stagger-children">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            disabled={isLoading}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-sm border border-border bg-[oklch(0.11_0.007_250)] hover:border-[oklch(0.78_0.14_68/0.4)] hover:bg-[oklch(0.78_0.14_68/0.05)] transition-all group animate-slide-up disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-[oklch(0.78_0.14_68/0.4)] group-hover:text-[oklch(0.78_0.14_68)] font-mono text-xs transition-colors select-none">
              ›
            </span>
            <span className="text-xs font-mono text-[oklch(0.58_0.008_250)] group-hover:text-foreground transition-colors">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Status row for sidebar ──────────────────────────────────────────────────
function StatusRow({
  label,
  value,
  positive,
  neutral,
}: {
  label: string;
  value: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  const valueColor = positive
    ? "oklch(0.72 0.14 195)"
    : neutral
      ? "oklch(0.52 0.008 250)"
      : "oklch(0.62 0.22 25)";

  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-[oklch(0.38_0.008_250)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className="text-[10px] font-mono font-semibold uppercase tracking-wider"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Micro components ────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="flex gap-1 items-center">
      <span
        className="size-1.5 rounded-full animate-bounce"
        style={{
          background: "oklch(0.78 0.14 68)",
          animationDelay: "-0.3s",
        }}
      />
      <span
        className="size-1.5 rounded-full animate-bounce"
        style={{
          background: "oklch(0.78 0.14 68)",
          animationDelay: "-0.15s",
        }}
      />
      <span
        className="size-1.5 rounded-full animate-bounce"
        style={{ background: "oklch(0.78 0.14 68)" }}
      />
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin size-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="oklch(0.09 0.008 250)"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="oklch(0.09 0.008 250)"
        d="M4 12a8 8 0 018-8V0C5.373 0 22 8.954 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
