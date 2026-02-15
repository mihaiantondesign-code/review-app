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
import { StarRating } from "./StarRating";
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
    cell: (info) => (
      <span className="tabular-nums text-text-secondary">{formatDate(info.getValue())}</span>
    ),
    sortingFn: "datetime",
  }),
  columnHelper.accessor("rating", {
    header: "Rating",
    cell: (info) => <StarRating rating={info.getValue()} size="sm" />,
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <span className="font-medium text-text-primary">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("review", {
    header: "Review",
    cell: (info) => {
      const text = info.getValue();
      const truncated = text.length > 200;
      return (
        <span className="text-text-secondary group/cell cursor-default" title={text}>
          {truncated ? text.slice(0, 200) : text}
          {truncated && (
            <span className="text-accent opacity-0 group-hover/cell:opacity-100 transition-opacity ml-0.5">...</span>
          )}
        </span>
      );
    },
  }),
  columnHelper.accessor("author", {
    header: "Author",
    cell: (info) => (
      <span className="text-text-secondary">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("version", {
    header: "Version",
    cell: (info) => (
      <span className="text-text-tertiary font-mono text-xs">{info.getValue()}</span>
    ),
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
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Show ratings</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => toggleRating(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-pill transition-all duration-150 ${
                ratingFilter.has(r)
                  ? "bg-text-primary text-white shadow-sm"
                  : "bg-[rgba(0,0,0,0.03)] text-text-tertiary hover:bg-[rgba(0,0,0,0.06)] hover:text-text-secondary"
              }`}
            >
              {r}★
            </button>
          ))}
        </div>
        <span className="text-xs text-text-tertiary ml-auto tabular-nums">
          {filteredData.length} reviews
        </span>
      </div>

      <div className="border border-border rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-bg-secondary">
                  {hg.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] cursor-pointer select-none transition-colors text-text-tertiary hover:text-text-primary hover:bg-bg-secondary/80"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className={`ml-1 ${sorted ? "text-accent" : "opacity-0"}`}>
                          {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 transition-colors hover:bg-bg-tertiary">
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
            className="px-4 py-2 text-xs font-medium rounded-pill transition-all duration-150 bg-[rgba(0,0,0,0.03)] text-text-secondary hover:bg-[rgba(0,0,0,0.06)] active:scale-[0.97] disabled:opacity-25 disabled:pointer-events-none"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 text-xs font-medium rounded-pill transition-all duration-150 bg-[rgba(0,0,0,0.03)] text-text-secondary hover:bg-[rgba(0,0,0,0.06)] active:scale-[0.97] disabled:opacity-25 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
        <span className="text-xs text-text-tertiary tabular-nums">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </div>
    </div>
  );
}
