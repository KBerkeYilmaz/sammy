"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  Loader2,
  Search,
  Filter,
  Brain,
  BarChart3,
  FileText,
  Clock,
  GitCompare,
  ClipboardList,
  Swords,
  CheckSquare,
  PenTool,
  Building2,
  GitBranch,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/page-header";

const SUGGESTED_PROMPTS = [
  "What opportunities should we pursue this week?",
  "Show me deadlines coming up in the next 14 days",
  "Find cybersecurity opportunities under NAICS 541519",
  "Compare the top 3 scored opportunities",
];

const TOOL_LABELS: Record<string, { label: string; icon: typeof Search }> = {
  "tool-searchByKeyword": { label: "Searching by keyword", icon: Search },
  "tool-searchBySemantic": { label: "Searching semantically", icon: Brain },
  "tool-filterOpportunities": { label: "Filtering opportunities", icon: Filter },
  // Phase 2 — Data tools
  "tool-getScoredPipeline": { label: "Checking scored pipeline", icon: BarChart3 },
  "tool-getCaptureBrief": { label: "Fetching capture brief", icon: FileText },
  "tool-deadlineMonitor": { label: "Monitoring deadlines", icon: Clock },
  "tool-compareOpportunities": { label: "Comparing opportunities", icon: GitCompare },
  // Phase 2 — AI tools
  "tool-analyzeRfp": { label: "Analyzing RFP", icon: ClipboardList },
  "tool-competitiveLandscape": { label: "Analyzing competitors", icon: Swords },
  "tool-generateComplianceMatrix": { label: "Building compliance matrix", icon: CheckSquare },
  "tool-draftProposalOutline": { label: "Drafting proposal outline", icon: PenTool },
  // Phase 3 — Onboarding
  "tool-setup_company_profile": { label: "Setting up company profile", icon: Building2 },
  // Phase 4 — Workflow Builder
  "tool-generate_workflow": { label: "Generating workflow", icon: GitBranch },
};

export function ChatShell() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const prevStatusRef = useRef<string>("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Only auto-scroll when the agent finishes a response, not during streaming
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Scroll when: new user message sent, or agent just finished
    if (
      status === "submitted" ||
      (prevStatus === "streaming" && status === "ready")
    ) {
      // Small delay so DOM settles before scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [status, scrollToBottom]);

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
      <PageHeader title="Chat" />

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState
            onPrompt={handleSuggestedPrompt}
            isLoading={isLoading}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="font-medium">Error:</span> {error.message}
              </div>
            )}

            {messages.map((message: UIMessage) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {status === "submitted" && (
              <div className="flex justify-start pl-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
      <div className="border-t bg-background px-6 py-5">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <textarea
            ref={inputRef}
            rows={2}
            className="flex-1 resize-none overflow-hidden rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ring min-h-[56px] max-h-40"
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
            className="size-11 shrink-0 rounded-xl"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in ${isUser ? "slide-in-from-right-2" : "slide-in-from-left-2"} duration-300`}
    >
      <div
        className={`rounded-xl text-sm ${
          isUser
            ? "max-w-[80%] bg-primary px-4 py-2.5 text-primary-foreground"
            : "max-w-[85%] bg-muted px-5 py-3"
        }`}
      >
        {isUser ? (
          message.parts.map((part, i) =>
            part.type === "text" ? <span key={i}>{part.text}</span> : null,
          )
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                );
              }

              // Tool call indicators — dynamically match any registered tool
              const toolInfo = TOOL_LABELS[part.type];
              if (toolInfo && "state" in part) {
                const Icon = toolInfo.icon;
                const isComplete = (part as { state: string }).state === "output-available";

                return (
                  <div
                    key={i}
                    className={`not-prose my-3 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs transition-all duration-500 ${
                      isComplete
                        ? "border-primary/20 bg-primary/5 text-muted-foreground"
                        : "border-border bg-background/50 text-foreground"
                    }`}
                  >
                    <Icon
                      className={`size-3.5 shrink-0 ${
                        isComplete
                          ? "text-primary"
                          : "animate-pulse text-primary"
                      }`}
                    />
                    <span className="font-medium">
                      {isComplete ? (
                        <>
                          {toolInfo.label}{" "}
                          <span className="font-normal text-muted-foreground">
                            &mdash; done
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {toolInfo.label}
                          <LoadingEllipsis />
                        </span>
                      )}
                    </span>
                  </div>
                );
              }

              return null;
            })}
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
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 animate-in zoom-in duration-500">
        <span className="text-xl font-bold text-primary">S</span>
      </div>
      <h2 className="text-lg font-semibold animate-in fade-in slide-in-from-bottom-1 duration-500 delay-100">
        Sammy
      </h2>
      <p className="mb-8 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500 delay-200">
        Federal contract intelligence powered by SAM.gov
      </p>

      <div className="w-full max-w-md space-y-2">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            disabled={isLoading}
            className="w-full rounded-lg border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:translate-x-1 disabled:cursor-not-allowed disabled:opacity-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${(idx + 2) * 75}ms` }}
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
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function LoadingEllipsis() {
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-bounce text-[10px] leading-none"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          .
        </span>
      ))}
    </span>
  );
}

