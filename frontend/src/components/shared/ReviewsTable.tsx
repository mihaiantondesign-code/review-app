"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { Review } from "@/types";
import { formatDate } from "@/lib/utils";

interface ReviewsTableProps {
  reviews: Review[];
  defaultRatingFilter?: number[];
}

const columnHelper = createColumnHelper<Review>();

const columns = [
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => formatDate(info.getValue()),
    sortingFn: "datetime",
  }),
  columnHelper.accessor("rating", {
    header: "Rating",
    cell: (info) => {
      const r = info.getValue();
      return (
        <span style={{ color: "#FFB800", letterSpacing: "1px" }}>
          {"★".repeat(r)}{"☆".repeat(5 - r)}
        </span>
      );
    },
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("review", {
    header: "Review",
    cell: (info) => {
      const text = info.getValue();
      return (
        <span className="text-text-secondary" title={text}>
          {text.length > 200 ? text.slice(0, 200) + "..." : text}
        </span>
      );
    },
  }),
  columnHelper.accessor("author", {
    header: "Author",
  }),
  columnHelper.accessor("version", {
    header: "Version",
  }),
];

export function ReviewsTable({ reviews, defaultRatingFilter = [1, 2, 3, 4, 5] }: ReviewsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [ratingFilter, setRatingFilter] = useState<Set<number>>(
    new Set(defaultRatingFilter)
  );

  const filteredData = useMemo(
    () => reviews.filter((r) => ratingFilter.has(r.rating)),
    [reviews, ratingFilter]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  const toggleRating = (r: number) => {
    setRatingFilter((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-text-primary">Filter:</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => toggleRating(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-pill transition-colors ${
                ratingFilter.has(r)
                  ? "bg-text-primary text-white"
                  : "bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.08)]"
              }`}
            >
              {r}★
            </button>
          ))}
        </div>
        <span className="text-xs text-text-secondary ml-auto">
          {filteredData.length} reviews
        </span>
      </div>

      <div className="border border-border rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-bg-secondary">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider cursor-pointer select-none hover:text-text-primary"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 text-xs font-medium rounded-pill bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 text-xs font-medium rounded-pill bg-[rgba(0,0,0,0.04)] text-text-secondary hover:bg-[rgba(0,0,0,0.08)] disabled:opacity-30"
          >
            Next
          </button>
        </div>
        <span className="text-xs text-text-secondary">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </div>
    </div>
  );
}
