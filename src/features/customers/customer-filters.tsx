"use client";

import { Search, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: "name" | "createdAt";
  setSortBy: (sort: "name" | "createdAt") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  onReset: () => void;
}

export function CustomerFilters({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onReset,
}: CustomerFiltersProps) {
  const isFilterActive = searchQuery.trim() !== "";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by name, nickname, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-10 text-sm bg-white border-slate-200"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="relative inline-flex items-center">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as ["name" | "createdAt", "asc" | "desc"];
              setSortBy(field);
              setSortOrder(order);
            }}
            className="appearance-none bg-white text-slate-700 text-xs font-semibold py-2 pl-8 pr-7 rounded-lg border border-slate-200 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {isFilterActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer h-9"
          >
            Clear Filter
          </Button>
        )}
      </div>
    </div>
  );
}
