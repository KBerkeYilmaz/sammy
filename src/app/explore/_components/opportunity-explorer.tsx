"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Search, SlidersHorizontal, Clock } from "lucide-react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const OPPORTUNITY_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Solicitation", value: "Solicitation" },
  { label: "Presolicitation", value: "Presolicitation" },
  { label: "Award Notice", value: "Award Notice" },
  { label: "Combined Synopsis/Solicitation", value: "Combined Synopsis/Solicitation" },
  { label: "Special Notice", value: "Special Notice" },
  { label: "Justification", value: "Justification" },
];

// ── Type → badge colors ──────────────────────────────────────────────────────
type TypeClass = {
  bg: string;
  text: string;
  border: string;
  abbr: string;
};

const TYPE_CLASSES: Record<string, TypeClass> = {
  Solicitation: {
    bg: "oklch(0.78 0.14 68 / 0.12)",
    text: "oklch(0.78 0.14 68)",
    border: "oklch(0.78 0.14 68 / 0.35)",
    abbr: "SOL",
  },
  "Combined Synopsis/Solicitation": {
    bg: "oklch(0.78 0.14 68 / 0.10)",
    text: "oklch(0.78 0.14 68)",
    border: "oklch(0.78 0.14 68 / 0.30)",
    abbr: "CSS",
  },
  "Award Notice": {
    bg: "oklch(0.72 0.14 195 / 0.10)",
    text: "oklch(0.72 0.14 195)",
    border: "oklch(0.72 0.14 195 / 0.30)",
    abbr: "AWD",
  },
  Presolicitation: {
    bg: "oklch(0.65 0.18 145 / 0.10)",
    text: "oklch(0.65 0.18 145)",
    border: "oklch(0.65 0.18 145 / 0.30)",
    abbr: "PRE",
  },
  "Special Notice": {
    bg: "oklch(0.60 0.20 310 / 0.10)",
    text: "oklch(0.60 0.20 310)",
    border: "oklch(0.60 0.20 310 / 0.30)",
    abbr: "SPN",
  },
  Justification: {
    bg: "oklch(0.52 0.008 250 / 0.12)",
    text: "oklch(0.65 0.008 250)",
    border: "oklch(0.52 0.008 250 / 0.30)",
    abbr: "JUS",
  },
};

function getTypeClass(type: string): TypeClass {
  return (
    TYPE_CLASSES[type] ?? {
      bg: "oklch(0.22 0.008 250 / 0.5)",
      text: "oklch(0.65 0.008 250)",
      border: "oklch(0.30 0.008 250)",
      abbr: type.substring(0, 3).toUpperCase(),
    }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function isApproaching(deadline: Date): boolean {
  const diff = new Date(deadline).getTime() - Date.now();
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function daysUntil(deadline: Date): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

// ── Type chip ────────────────────────────────────────────────────────────────
function TypeChip({ type }: { type: string }) {
  const cls = getTypeClass(type);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono font-semibold tracking-wider uppercase"
      style={{
        background: cls.bg,
        color: cls.text,
        border: `1px solid ${cls.border}`,
      }}
    >
      {cls.abbr}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OpportunityExplorer() {
  const [deptInput, setDeptInput] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce department 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDepartment(deptInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [deptInput]);

  const { data, isFetching } = api.opportunities.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    department: department || undefined,
    type: type === "all" ? undefined : type,
    activeOnly: activeOnly || undefined,
  });

  const { data: detail, isFetching: detailFetching } =
    api.opportunities.getById.useQuery(
      { id: selectedId! },
      { enabled: !!selectedId },
    );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const hasFilters = deptInput !== "" || type !== "all" || activeOnly;

  function clearFilters() {
    setDeptInput("");
    setDepartment("");
    setType("all");
    setActiveOnly(false);
    setPage(0);
  }

  const start = data && data.total > 0 ? page * PAGE_SIZE + 1 : 0;
  const end = data ? Math.min((page + 1) * PAGE_SIZE, data.total) : 0;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="border-b border-border bg-[oklch(0.10_0.007_250)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter by department…"
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              className="pl-8 h-8 w-56 bg-[oklch(0.13_0.007_250)] border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/60 rounded-sm focus-visible:ring-[oklch(0.78_0.14_68/0.4)] focus-visible:border-[oklch(0.78_0.14_68/0.4)]"
            />
          </div>

          {/* Type select */}
          <Select
            value={type}
            onValueChange={(val) => {
              if (val !== null) setType(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-52 bg-[oklch(0.13_0.007_250)] border-border text-sm font-mono rounded-sm focus:ring-[oklch(0.78_0.14_68/0.4)]">
              <SlidersHorizontal className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[oklch(0.13_0.007_250)] border-border rounded-sm font-mono text-sm">
              {OPPORTUNITY_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="focus:bg-[oklch(0.78_0.14_68/0.12)] focus:text-[oklch(0.78_0.14_68)]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active only toggle */}
          <label className="flex cursor-pointer items-center gap-2 group">
            <div className="relative">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => {
                  setActiveOnly(e.target.checked);
                  setPage(0);
                }}
                className="sr-only peer"
              />
              <div className="h-4 w-7 rounded-[2px] bg-[oklch(0.17_0.008_250)] border border-border peer-checked:bg-[oklch(0.78_0.14_68/0.2)] peer-checked:border-[oklch(0.78_0.14_68/0.5)] transition-colors" />
              <div className="absolute left-0.5 top-0.5 size-3 rounded-[1px] bg-muted-foreground peer-checked:translate-x-3 peer-checked:bg-[oklch(0.78_0.14_68)] transition-all" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
              Active Only
            </span>
          </label>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="size-3" />
              Clear
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Record count */}
          <div className="text-[11px] font-mono text-muted-foreground">
            {data ? (
              data.total === 0 ? (
                <span className="text-muted-foreground/60">NO RESULTS</span>
              ) : (
                <>
                  <span className="text-[oklch(0.78_0.14_68)] font-semibold">
                    {start}–{end}
                  </span>
                  {" / "}
                  <span className="text-foreground font-semibold">
                    {data.total.toLocaleString()}
                  </span>
                  {" RECORDS"}
                </>
              )
            ) : (
              "LOADING…"
            )}
            {isFetching && (
              <span className="ml-2 animate-pulse text-[oklch(0.52_0.008_250)]">
                ↻
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <Table className="w-full border-collapse">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-[oklch(0.10_0.007_250)] border-b border-border hover:bg-[oklch(0.10_0.007_250)]">
              {(["TYPE", "TITLE", "DEPARTMENT", "NAICS", "POSTED", "DEADLINE"] as const).map(
                (col) => (
                  <TableHead
                    key={col}
                    className="h-9 px-4 text-[10px] font-mono font-semibold tracking-widest uppercase text-[oklch(0.45_0.008_250)] border-r border-border/50 last:border-0 whitespace-nowrap"
                  >
                    {col}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Skeleton rows */}
            {!data &&
              Array.from({ length: 12 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/30 hover:bg-transparent">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j} className="px-4 py-3">
                      <div
                        className="h-3 rounded-[1px] animate-pulse"
                        style={{
                          background: "oklch(0.16 0.007 250)",
                          width: `${60 + Math.sin(i * j) * 25}%`,
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl font-mono text-border">◌</span>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      No opportunities match your filters
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((opp, i) => {
              const approaching =
                opp.responseDeadline ? isApproaching(opp.responseDeadline) : false;
              const days = opp.responseDeadline ? daysUntil(opp.responseDeadline) : null;
              const isSelected = selectedId === opp.id;

              return (
                <TableRow
                  key={opp.id}
                  onClick={() => setSelectedId(opp.id)}
                  className={[
                    "cursor-pointer border-b border-border/30 transition-colors",
                    isSelected
                      ? "bg-[oklch(0.78_0.14_68/0.06)] border-l-2 border-l-[oklch(0.78_0.14_68)]"
                      : i % 2 !== 0
                        ? "bg-[oklch(0.10_0.007_250/0.4)]"
                        : "",
                    "hover:bg-[oklch(0.78_0.14_68/0.04)]",
                  ].join(" ")}
                >
                  {/* Type */}
                  <TableCell className="px-4 py-2.5 border-r border-border/30 w-16">
                    <TypeChip type={opp.type} />
                  </TableCell>

                  {/* Title */}
                  <TableCell className="px-4 py-2.5 border-r border-border/30 max-w-sm">
                    <span className="line-clamp-2 text-xs font-medium text-foreground leading-snug">
                      {opp.title}
                    </span>
                  </TableCell>

                  {/* Department */}
                  <TableCell className="px-4 py-2.5 border-r border-border/30 max-w-[160px]">
                    <span className="block truncate text-[11px] font-mono text-muted-foreground">
                      {opp.department ?? "—"}
                    </span>
                  </TableCell>

                  {/* NAICS */}
                  <TableCell className="px-4 py-2.5 border-r border-border/30 w-24">
                    <span className="text-[11px] font-mono text-[oklch(0.45_0.008_250)]">
                      {opp.naicsCode ?? "—"}
                    </span>
                  </TableCell>

                  {/* Posted */}
                  <TableCell className="px-4 py-2.5 border-r border-border/30 w-28">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {formatDate(opp.postedDate)}
                    </span>
                  </TableCell>

                  {/* Deadline */}
                  <TableCell className="px-4 py-2.5 w-32">
                    {opp.responseDeadline ? (
                      <div className="flex items-center gap-1.5">
                        {approaching && (
                          <Clock className="size-3 shrink-0 text-destructive" />
                        )}
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            approaching
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDate(opp.responseDeadline)}
                        </span>
                        {approaching && days !== null && days >= 0 && (
                          <span className="text-[9px] font-mono text-destructive/70">
                            {days}d
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-[oklch(0.30_0.008_250)]">
                        —
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="border-t border-border bg-[oklch(0.10_0.007_250)] px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            PAGE {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-7 px-3 rounded-sm border-border bg-transparent text-[11px] font-mono uppercase tracking-wider hover:bg-[oklch(0.78_0.14_68/0.08)] hover:border-[oklch(0.78_0.14_68/0.4)] hover:text-[oklch(0.78_0.14_68)] disabled:opacity-30"
            >
              <ChevronLeft className="size-3 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 px-3 rounded-sm border-border bg-transparent text-[11px] font-mono uppercase tracking-wider hover:bg-[oklch(0.78_0.14_68/0.08)] hover:border-[oklch(0.78_0.14_68/0.4)] hover:text-[oklch(0.78_0.14_68)] disabled:opacity-30"
            >
              Next
              <ChevronRight className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail Sheet ─────────────────────────────────────── */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl bg-[oklch(0.10_0.007_250)] border-border"
        >
          {/* Header */}
          <SheetHeader className="border-b border-border px-6 py-5 pr-14 bg-[oklch(0.09_0.008_250)]">
            {/* Classification + type */}
            <div className="flex items-center gap-2 mb-2">
              {detail && <TypeChip type={detail.type} />}
              {detail?.active ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-[2px]"
                  style={{
                    background: "oklch(0.72 0.14 195 / 0.10)",
                    color: "oklch(0.72 0.14 195)",
                    border: "1px solid oklch(0.72 0.14 195 / 0.30)",
                  }}>
                  ● ACTIVE
                </span>
              ) : detail ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-[2px]"
                  style={{
                    background: "oklch(0.22 0.008 250 / 0.5)",
                    color: "oklch(0.52 0.008 250)",
                    border: "1px solid oklch(0.30 0.008 250)",
                  }}>
                  CLOSED
                </span>
              ) : null}
            </div>

            <SheetTitle className="text-sm font-semibold leading-snug text-foreground">
              {detailFetching && !detail
                ? "Loading…"
                : detail?.title}
            </SheetTitle>
            {detail && (
              <SheetDescription className="mt-1 text-[11px] font-mono text-muted-foreground tracking-wider">
                {detail.solicitationNumber ?? detail.noticeId}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {detailFetching && !detail && (
              <div className="p-6 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 animate-pulse rounded-[1px]"
                    style={{
                      background: "oklch(0.16 0.007 250)",
                      width: `${50 + Math.sin(i * 2) * 30}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {detail && (
              <div className="divide-y divide-border/50">
                {/* Key Dates */}
                <DetailSection label="Key Dates">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailField label="Posted">
                      {formatDate(detail.postedDate)}
                    </DetailField>
                    <DetailField
                      label="Response Deadline"
                      urgent={
                        !!detail.responseDeadline &&
                        isApproaching(detail.responseDeadline)
                      }
                    >
                      {formatDate(detail.responseDeadline)}
                      {detail.responseDeadline &&
                        isApproaching(detail.responseDeadline) && (
                          <span className="ml-1.5 text-[10px] font-mono text-destructive/70">
                            ({daysUntil(detail.responseDeadline)}d remaining)
                          </span>
                        )}
                    </DetailField>
                  </div>
                </DetailSection>

                {/* Agency */}
                <DetailSection label="Agency">
                  <div className="space-y-3">
                    <DetailField label="Department">{detail.department}</DetailField>
                    {detail.subTier && (
                      <DetailField label="Sub-Tier">{detail.subTier}</DetailField>
                    )}
                    {detail.office && (
                      <DetailField label="Office">{detail.office}</DetailField>
                    )}
                    {detail.state && (
                      <DetailField label="State">{detail.state}</DetailField>
                    )}
                  </div>
                </DetailSection>

                {/* Contact */}
                {(detail.contactName ?? detail.contactEmail) && (
                  <DetailSection label="Point of Contact">
                    <div className="space-y-3">
                      {detail.contactName && (
                        <DetailField label="Name">{detail.contactName}</DetailField>
                      )}
                      {detail.contactEmail && (
                        <DetailField label="Email">
                          <a
                            href={`mailto:${detail.contactEmail}`}
                            className="text-[oklch(0.72_0.14_195)] hover:underline"
                          >
                            {detail.contactEmail}
                          </a>
                        </DetailField>
                      )}
                    </div>
                  </DetailSection>
                )}

                {/* Award */}
                {(detail.awardAmount != null || detail.awardeeName) && (
                  <DetailSection label="Award">
                    <div className="grid grid-cols-2 gap-4">
                      {detail.awardAmount != null && (
                        <DetailField label="Amount">
                          <span className="text-[oklch(0.78_0.14_68)] font-semibold">
                            {formatCurrency(detail.awardAmount)}
                          </span>
                        </DetailField>
                      )}
                      {detail.awardeeName && (
                        <DetailField label="Awardee">{detail.awardeeName}</DetailField>
                      )}
                    </div>
                  </DetailSection>
                )}

                {/* Procurement */}
                <DetailSection label="Procurement Details">
                  <div className="space-y-3">
                    <DetailField label="Notice ID">
                      <span className="font-mono text-[11px] text-[oklch(0.72_0.14_195)]">
                        {detail.noticeId}
                      </span>
                    </DetailField>
                    {detail.solicitationNumber && (
                      <DetailField label="Solicitation Number">
                        <span className="font-mono text-[11px]">
                          {detail.solicitationNumber}
                        </span>
                      </DetailField>
                    )}
                    {detail.naicsCode && (
                      <DetailField label="NAICS Code">
                        <span className="font-mono text-[11px]">{detail.naicsCode}</span>
                      </DetailField>
                    )}
                    {detail.classificationCode && (
                      <DetailField label="Classification Code">
                        {detail.classificationCode}
                      </DetailField>
                    )}
                    {detail.baseType && (
                      <DetailField label="Base Type">{detail.baseType}</DetailField>
                    )}
                  </div>
                </DetailSection>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Section + Field helpers ───────────────────────────────────────────────────
function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-3 bg-[oklch(0.78_0.14_68)]" />
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[oklch(0.52_0.008_250)]">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

function DetailField({
  label,
  children,
  urgent = false,
}: {
  label: string;
  children: React.ReactNode;
  urgent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-mono tracking-widest uppercase text-[oklch(0.38_0.008_250)] mb-0.5">
        {label}
      </dt>
      <dd
        className={`text-sm ${urgent ? "text-destructive font-semibold" : "text-foreground"}`}
      >
        {children}
      </dd>
    </div>
  );
}
