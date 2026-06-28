import { getDashboardStats, getMonthlyTrend, getRecentExpenses } from "@/services/dashboard-actions";
import { StatsCards } from "@/features/dashboard/stats-cards";
import { AnalyticsCharts } from "@/features/dashboard/analytics-charts";
import { RecentExpenses } from "@/features/dashboard/recent-expenses";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { LandingRedirect } from "@/components/landing-redirect";
import { format } from "date-fns";

export const revalidate = 0; // Fetch fresh data on every request

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { startDate, endDate } = await searchParams;

  const now = new Date();
  const defaultStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const defaultEnd = format(now, "yyyy-MM-dd");

  const start = startDate || defaultStart;
  const end = endDate || defaultEnd;

  // Fetch stats, trends, and recent logs for the specified date range in parallel
  const [stats, trendData, recentExpenses] = await Promise.all([
    getDashboardStats(start, end),
    getMonthlyTrend(start, end),
    getRecentExpenses(start, end)
  ]);

  return (
    <div className="space-y-6">
      {/* Client-side redirect enforcer if user starred another landing page */}
      <LandingRedirect />

      {/* Vitals Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
            <span className="text-2xl font-normal text-slate-400">& Analytics</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time overview of customer budgets and expenses.
          </p>
        </div>

        {/* Workable Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <DateRangePicker initialStartDate={start} initialEndDate={end} />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts section */}
      <AnalyticsCharts
        totalCredit={stats.totalCredit}
        totalDebit={stats.totalDebit}
        trendData={trendData}
      />

      {/* Recent expenses trail */}
      <div className="grid gap-6">
        <RecentExpenses expenses={recentExpenses} />
      </div>
    </div>
  );
}
