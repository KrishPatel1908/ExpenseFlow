"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

interface DateRangePickerProps {
  initialStartDate: string;
  initialEndDate: string;
}

export function DateRangePicker({ initialStartDate, initialEndDate }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleDateChange = (type: "startDate" | "endDate", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 shadow-xs w-full sm:w-auto">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <CalendarRange className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="w-10 shrink-0">From:</span>
        <input
          type="date"
          value={initialStartDate}
          onChange={(e) => handleDateChange("startDate", e.target.value)}
          className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
        />
      </div>
      <span className="hidden sm:inline text-slate-300">|</span>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Spacer of the same width as the Calendar icon (h-4 w-4) + gap-2 (8px) to align columns on mobile */}
        <div className="w-4 h-4 shrink-0 sm:hidden" />
        <span className="w-10 shrink-0">To:</span>
        <input
          type="date"
          value={initialEndDate}
          onChange={(e) => handleDateChange("endDate", e.target.value)}
          className="bg-transparent border-none text-slate-800 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
        />
      </div>
    </div>
  );
}
