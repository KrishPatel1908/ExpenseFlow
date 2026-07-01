import { useState, useRef, useEffect } from "react";
import { Search, Filter, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  typeFilter: "all" | "credit" | "debit";
  setTypeFilter: (val: "all" | "credit" | "debit") => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  dbCategories: string[];
}

export function ExpenseFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dbCategories,
}: ExpenseFiltersProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catFilterRef = useRef<HTMLDivElement>(null);

  // Close category filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catFilterRef.current && !catFilterRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-2xl shadow-xs mb-6">
      {/* Row 1: Search Input + Mobile Filter Toggle Button */}
      <div className="flex gap-3 items-center w-full">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, mobile, category, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-10 text-sm border border-slate-200 rounded-full bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0b132a] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className={cn(
            "rounded-full h-10 px-4 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 sm:hidden cursor-pointer shrink-0 transition-all",
            isFiltersExpanded && "bg-slate-100 text-slate-950 border-slate-300"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Row 2: 4 Filters with Equal Spacing */}
      <div className={cn(
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 transition-all duration-300 mt-4",
        isFiltersExpanded ? "grid animate-in fade-in slide-in-from-top-2" : "hidden sm:grid"
      )}>
        {/* Filter 1: Transaction Type */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Type</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "credit" | "debit")}
            className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
          >
            <option value="all">All Types</option>
            <option value="credit">Credit Only</option>
            <option value="debit">Debit Only</option>
          </select>
        </div>

        {/* Filter 2: Category (Custom Dropdown) */}
        <div className="flex flex-col gap-1.5 relative" ref={catFilterRef}>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category</span>
          <button
            type="button"
            onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
            className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-750 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70 flex items-center justify-between text-left"
          >
            <span>{categoryFilter === "all" ? "All Categories" : categoryFilter}</span>
            <span className="text-slate-400 text-[9px] ml-1">▼</span>
          </button>

          {isCatDropdownOpen && (
            <div className="absolute z-50 w-full top-[58px] bg-white border border-slate-150 rounded-xl shadow-md max-h-[220px] overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setIsCatDropdownOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                  categoryFilter === "all" ? "bg-[#0b132a] text-white font-semibold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                All Categories
              </button>
              {dbCategories.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsCatDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                      isSelected ? "bg-[#0b132a] text-white font-semibold" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter 3: From Date */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5 text-slate-400" /> From Date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
          />
        </div>

        {/* Filter 4: To Date */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5 text-slate-400" /> To Date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b132a] cursor-pointer w-full transition-all hover:bg-slate-100/70"
          />
        </div>
      </div>

      {/* Clear Date Filter Button - Desktop */}
      {(startDate || endDate) && (
        <div className={cn(
          "justify-end pt-2 border-t border-slate-100",
          isFiltersExpanded ? "flex" : "hidden sm:flex"
        )}>
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
          >
            Clear Date Filter
          </button>
        </div>
      )}
    </div>
  );
}
