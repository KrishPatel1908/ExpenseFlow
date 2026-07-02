"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Cell
} from "recharts";

interface AnalyticsChartsProps {
  totalCredit: number;
  totalDebit: number;
  trendData: { month: string; amount: number }[];
}

export function AnalyticsCharts({
  totalCredit,
  totalDebit,
  trendData,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const creditVsDebitData = [
    {
      name: "Credit",
      amount: totalCredit,
      fill: "#10b981", // Emerald
    },
    {
      name: "Debit",
      amount: totalDebit,
      fill: "#f59e0b", // Amber
    },
  ];

  if (!mounted) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border border-slate-100 bg-white p-6 h-[350px] animate-pulse rounded-xl" />
        <Card className="border border-slate-100 bg-white p-6 h-[350px] animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Left Card: Credit vs Debit Comparison */}
      <Card className="border border-slate-100 bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-800 tracking-tight">Credit vs Debit Comparison</CardTitle>
            <CardDescription className="text-xs text-slate-400">Comparison of total credits vs total debits recorded</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span>Credit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span>Debit</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditVsDebitData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                />
                <Tooltip
                  formatter={(value: number | string | unknown) => [formatCurrency(Number(value || 0)), "Amount"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  labelStyle={{ fontWeight: "700", color: "#0f172a", fontSize: 12 }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {creditVsDebitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Right Card: Net Balance Trend */}
      <Card className="border border-slate-100 bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-800 tracking-tight">Net Balance Trend</CardTitle>
            <CardDescription className="text-xs text-slate-400">Overview of net balance (Credit - Debit) across months</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#4f46e5]" />
              <span>Net Trend</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                />
                <Tooltip
                  formatter={(value: number | string | unknown) => [formatCurrency(Number(value || 0)), "Net Balance"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  labelStyle={{ fontWeight: "700", color: "#0f172a", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 1, stroke: "#ffffff", fill: "#4f46e5" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
