"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Opportunity } from "@prisma/client";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

function typeBadgeVariant(
  type: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (type === "Solicitation" || type === "Combined Synopsis/Solicitation")
    return "default";
  if (type === "Award Notice") return "secondary";
  return "outline";
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isApproaching(deadline: Date): boolean {
  const diff = new Date(deadline).getTime() - Date.now();
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export const columns: ColumnDef<Opportunity>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Title
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-xs font-medium leading-snug">
        {row.getValue("title")}
      </span>
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Department
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="block max-w-[180px] truncate text-muted-foreground">
        {row.getValue("department")}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant={typeBadgeVariant(type)}>{type}</Badge>;
    },
    filterFn: (row, id, value: string) => {
      if (value === "all") return true;
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: "postedDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Posted
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.getValue("postedDate"))}
      </span>
    ),
  },
  {
    accessorKey: "responseDeadline",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Deadline
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const deadline = row.getValue("responseDeadline") as Date | null;
      if (!deadline) return <span className="text-muted-foreground">\u2014</span>;
      return (
        <span
          className={
            isApproaching(deadline)
              ? "font-medium text-destructive"
              : "text-muted-foreground"
          }
        >
          {formatDate(deadline)}
        </span>
      );
    },
  },
  {
    accessorKey: "naicsCode",
    header: "NAICS",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {(row.getValue("naicsCode") as string | null) ?? "\u2014"}
      </span>
    ),
  },
];
