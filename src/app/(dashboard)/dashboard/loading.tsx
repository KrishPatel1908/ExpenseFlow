export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Vitals Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="h-8 w-48 bg-slate-200 rounded-md" />
            <div className="h-6 w-24 bg-slate-100 rounded-md hidden sm:block" />
          </div>
          <div className="h-4 w-64 bg-slate-200/80 rounded-md" />
        </div>
        {/* Date Range Picker Skeleton */}
        <div className="h-10 w-full sm:w-64 bg-slate-200 rounded-xl" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 rounded-md" />
              <div className="h-5 w-5 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-20 bg-slate-300 rounded-md" />
              <div className="h-3 w-32 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Panel Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Monthly Trend Area Chart Skeleton */}
        <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-slate-300 rounded-md" />
              <div className="h-3 w-48 bg-slate-200 rounded-md" />
            </div>
          </div>
          <div className="h-[250px] w-full bg-slate-100 rounded-xl flex items-end justify-between p-4 gap-2">
            {[...Array(12)].map((_, idx) => (
              <div
                key={idx}
                className="w-full bg-slate-200 rounded-t-sm"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>

        {/* Balance Share Pie Chart Skeleton */}
        <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-slate-300 rounded-md" />
            <div className="h-3 w-44 bg-slate-200 rounded-md" />
          </div>
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-36 w-36 rounded-full border-[16px] border-slate-200 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
      </div>

      {/* Recent Expenses Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="space-y-1.5">
          <div className="h-5 w-40 bg-slate-300 rounded-md" />
          <div className="h-3 w-52 bg-slate-200 rounded-md" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-300 rounded-md" />
                  <div className="h-3 w-20 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
