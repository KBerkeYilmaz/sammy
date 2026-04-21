"use client";

import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Opportunity } from "@prisma/client";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
import { SidebarTrigger } from "~/components/ui/sidebar";
import { columns } from "./columns";
import { DataTable } from "./data-table";

// ── Atoms ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const titleInputAtom = atom("");
const titleAtom = atom("");
const deptInputAtom = atom("");
const departmentAtom = atom("");
const typeAtom = atom("all");
const activeOnlyAtom = atom(false);
const pageAtom = atom(0);
const selectedIdAtom = atom<string | null>(null);

const OPPORTUNITY_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Solicitation", value: "Solicitation" },
  { label: "Presolicitation", value: "Presolicitation" },
  { label: "Award Notice", value: "Award Notice" },
  { label: "Combined Synopsis/Solicitation", value: "Combined Synopsis/Solicitation" },
  { label: "Special Notice", value: "Special Notice" },
  { label: "Justification", value: "Justification" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "\u2014";
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

function typeBadgeVariant(
  type: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (type === "Solicitation" || type === "Combined Synopsis/Solicitation") return "default";
  if (type === "Award Notice") return "secondary";
  return "outline";
}

// ── Main component ───────────────────────────────────────────────────────────

export function OpportunityExplorer() {
  const [titleInput, setTitleInput] = useAtom(titleInputAtom);
  const [title, setTitle] = useAtom(titleAtom);
  const [deptInput, setDeptInput] = useAtom(deptInputAtom);
  const [department, setDepartment] = useAtom(departmentAtom);
  const [type, setType] = useAtom(typeAtom);
  const [activeOnly, setActiveOnly] = useAtom(activeOnlyAtom);
  const [page, setPage] = useAtom(pageAtom);
  const [selectedId, setSelectedId] = useAtom(selectedIdAtom);

  // Debounce title filter
  useEffect(() => {
    const t = setTimeout(() => {
      setTitle(titleInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [titleInput, setTitle, setPage]);

  // Debounce department filter
  useEffect(() => {
    const t = setTimeout(() => {
      setDepartment(deptInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [deptInput, setDepartment, setPage]);

  const { data, isFetching } = api.opportunities.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    title: title || undefined,
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
  const hasFilters = titleInput !== "" || deptInput !== "" || type !== "all" || activeOnly;

  function clearFilters() {
    setTitleInput("");
    setTitle("");
    setDeptInput("");
    setDepartment("");
    setType("all");
    setActiveOnly(false);
    setPage(0);
  }

  const start = data && data.total > 0 ? page * PAGE_SIZE + 1 : 0;
  const end = data ? Math.min((page + 1) * PAGE_SIZE, data.total) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold">Explore Opportunities</h1>
        {isFetching && (
          <span className="ml-auto animate-pulse text-xs text-muted-foreground">
            Refreshing\u2026
          </span>
        )}
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            placeholder="Search by title..."
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="w-56"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Department</label>
          <Input
            placeholder="e.g. Department of Defense"
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={type}
            onValueChange={(val) => {
              if (val !== null) setType(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked);
              setPage(0);
            }}
            className="size-4 accent-primary"
          />
          <span className="text-sm font-medium">Active only</span>
        </label>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-5">
            Clear filters
          </Button>
        )}

        <div className="flex-1" />

        <p className="mt-5 text-sm text-muted-foreground">
          {data ? (
            data.total === 0 ? (
              "No results"
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {start}&ndash;{end}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {data.total.toLocaleString()}
                </span>
              </>
            )
          ) : (
            "Loading\u2026"
          )}
        </p>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto p-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={!data}
          selectedId={selectedId}
          getRowId={(row: Opportunity) => row.id}
          onRowClick={(row: Opportunity) => setSelectedId(row.id)}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b px-6 py-4 pr-12">
            <SheetTitle className="leading-snug">
              {detailFetching && !detail ? "Loading\u2026" : detail?.title}
            </SheetTitle>
            {detail && (
              <SheetDescription>
                {detail.solicitationNumber ?? detail.noticeId}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {detailFetching && !detail && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-muted" />
                ))}
              </div>
            )}

            {detail && (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={typeBadgeVariant(detail.type)}>{detail.type}</Badge>
                  {detail.active ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="outline">Closed</Badge>
                  )}
                  {detail.naicsCode && (
                    <Badge variant="outline">NAICS {detail.naicsCode}</Badge>
                  )}
                </div>

                <section>
                  <SectionHeader>Key Dates</SectionHeader>
                  <dl className="grid grid-cols-2 gap-4">
                    <Field label="Posted">{formatDate(detail.postedDate)}</Field>
                    <Field
                      label="Response Deadline"
                      highlight={
                        !!detail.responseDeadline && isApproaching(detail.responseDeadline)
                      }
                    >
                      {formatDate(detail.responseDeadline)}
                    </Field>
                  </dl>
                </section>

                <section>
                  <SectionHeader>Agency</SectionHeader>
                  <dl className="space-y-3">
                    <Field label="Department">{detail.department}</Field>
                    {detail.subTier && <Field label="Sub-Tier">{detail.subTier}</Field>}
                    {detail.office && <Field label="Office">{detail.office}</Field>}
                    {detail.state && <Field label="State">{detail.state}</Field>}
                  </dl>
                </section>

                {(detail.contactName ?? detail.contactEmail) && (
                  <section>
                    <SectionHeader>Point of Contact</SectionHeader>
                    <dl className="space-y-3">
                      {detail.contactName && (
                        <Field label="Name">{detail.contactName}</Field>
                      )}
                      {detail.contactEmail && (
                        <Field label="Email">
                          <a
                            href={`mailto:${detail.contactEmail}`}
                            className="text-primary hover:underline"
                          >
                            {detail.contactEmail}
                          </a>
                        </Field>
                      )}
                    </dl>
                  </section>
                )}

                {(detail.awardAmount != null || detail.awardeeName) && (
                  <section>
                    <SectionHeader>Award</SectionHeader>
                    <dl className="grid grid-cols-2 gap-4">
                      {detail.awardAmount != null && (
                        <Field label="Amount">{formatCurrency(detail.awardAmount)}</Field>
                      )}
                      {detail.awardeeName && (
                        <Field label="Awardee">{detail.awardeeName}</Field>
                      )}
                    </dl>
                  </section>
                )}

                <section>
                  <SectionHeader>Procurement Details</SectionHeader>
                  <dl className="space-y-3">
                    <Field label="Notice ID">
                      <span className="font-mono text-xs">{detail.noticeId}</span>
                    </Field>
                    {detail.solicitationNumber && (
                      <Field label="Solicitation Number">
                        <span className="font-mono text-xs">{detail.solicitationNumber}</span>
                      </Field>
                    )}
                    {detail.classificationCode && (
                      <Field label="Classification Code">{detail.classificationCode}</Field>
                    )}
                    {detail.baseType && <Field label="Base Type">{detail.baseType}</Field>}
                  </dl>
                </section>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm ${highlight ? "font-semibold text-destructive" : ""}`}>
        {children}
      </dd>
    </div>
  );
}
