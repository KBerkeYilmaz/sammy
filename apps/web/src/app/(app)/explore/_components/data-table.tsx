"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  selectedId?: string | null;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  onRowClick,
  selectedId,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getRowId: getRowId as (row: TData) => string,
    state: { sorting },
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {/* Loading skeleton */}
          {isLoading &&
            data.length === 0 &&
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j} className="px-4">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {/* Empty state */}
          {!isLoading && table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-16 text-center text-muted-foreground"
              >
                No opportunities found. Try adjusting your filters.
              </TableCell>
            </TableRow>
          )}

          {/* Data rows */}
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={[
                "cursor-pointer",
                selectedId && row.id === selectedId ? "bg-primary/5" : "",
              ].join(" ")}
              data-state={selectedId && row.id === selectedId ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
