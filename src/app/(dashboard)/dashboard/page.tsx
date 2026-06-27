import { getDashboardStats, getMonthlyTrend, getRecentExpenses } from "@/services/dashboard-actions";
import { StatsCards } from "@/features/dashboard/stats-cards";
import { AnalyticsCharts } from "@/features/dashboard/analytics-charts";
import { RecentExpenses } from "@/features/dashboard/recent-expenses";

export const revalidate = 0; // Fetch fresh data on every request

export default async function DashboardPage() {
  // Fetch stats, trends, and recent logs in parallel on the server
  const [stats, trendData, recentExpenses] = await Promise.all([
    getDashboardStats(),
    getMonthlyTrend(),
    getRecentExpenses()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time overview of customer budgets and expenses.</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts section */}
      <AnalyticsCharts 
        totalMonthlyBudget={stats.totalMonthlyBudget}
        totalMonthlyExpense={stats.totalMonthlyExpense}
        trendData={trendData}
      />

      {/* Recent expenses trail */}
      <div className="grid gap-6">
        <RecentExpenses expenses={recentExpenses} />
      </div>
    </div>
  );
}
