"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, Phone, Loader2, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getBudgetAlerts, BudgetAlert } from "@/services/alerts-actions";
import { toast } from "sonner";

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBudgetAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error("Failed to load budget alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budget Alerts</h1>
        <p className="text-slate-500">Real-time status of customers who have exceeded their monthly or yearly budget limits.</p>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            <p className="text-sm">Analyzing budgets...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card className="border border-emerald-100 bg-emerald-50/20 p-8 text-center rounded-xl max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-emerald-950">All Budgets Intact</h3>
              <p className="text-sm text-emerald-700 font-medium">
                Great job! No customers have exceeded their allocated monthly or yearly budget limits.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1">
            {alerts.map((alert) => (
              <Card
                key={alert.customerId}
                onClick={() => router.push(`/customers/${alert.customerId}`)}
                className="group relative grid grid-cols-1 md:grid-cols-12 items-center gap-4 border border-slate-200 bg-white p-6 shadow-xs rounded-xl hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-350 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Left Section: Avatar + Details */}
                <div className="md:col-span-4 flex items-center gap-4 shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm">
                    <AlertCircle className="h-5.5 w-5.5" />
                  </div>
                  <div className="overflow-hidden space-y-1">
                    <h3 className="font-bold text-slate-800 group-hover:text-slate-950 transition-colors text-base tracking-tight truncate">
                      {alert.customerName}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {alert.isMonthlyOverrun && (
                        <span className="text-[9px] font-extrabold bg-rose-50 border border-rose-100/50 text-rose-700 uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Monthly Exceeded
                        </span>
                      )}
                      {alert.isYearlyOverrun && (
                        <span className="text-[9px] font-extrabold bg-red-50 border border-red-100/50 text-red-700 uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Yearly Exceeded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Section: Overrun Details */}
                <div className="md:col-span-5 flex flex-row gap-6 my-2 md:my-0 text-xs justify-start md:justify-center">
                  {/* Monthly Status */}
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl space-y-0.5 min-w-[145px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monthly Spend</span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(alert.currentMonthlyExpense)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Limit: {formatCurrency(alert.monthlyBudget)}
                    </p>
                    {alert.isMonthlyOverrun && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                        +{formatCurrency(alert.monthlyOverrunAmount)} Over
                      </p>
                    )}
                  </div>

                  {/* Yearly Status */}
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl space-y-0.5 min-w-[145px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Yearly Spend</span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(alert.currentYearlyExpense)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Limit: {formatCurrency(alert.yearlyBudget)}
                    </p>
                    {alert.isYearlyOverrun && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                        +{formatCurrency(alert.yearlyOverrunAmount)} Over
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section: Navigation Link */}
                <div className="md:col-span-3 flex items-center justify-end gap-5 pt-2 md:pt-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-950 transition-colors">
                    <span>Analyze Details</span>
                    <ArrowRight className="h-3.5 w-3.5 translate-x-0 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-950" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
