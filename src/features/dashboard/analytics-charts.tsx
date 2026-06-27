"use strict";

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
  LineChart,
  Line,
  Cell
} from "recharts";

interface AnalyticsChartsProps {
  totalMonthlyBudget: number;
  totalMonthlyExpense: number;
  trendData: { month: string; amount: number }[];
}

export function AnalyticsCharts({
  totalMonthlyBudget,
  totalMonthlyExpense,
  trendData,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const budgetVsExpenseData = [
    {
      name: "Budget",
      amount: totalMonthlyBudget,
      fill: "#0ea5e9", // Sky-500
    },
    {
      name: "Expense",
      amount: totalMonthlyExpense,
      fill: totalMonthlyExpense > totalMonthlyBudget ? "#ef4444" : "#f43f5e", // Red-500 or Rose-500
    },
  ];

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200 bg-white p-6 h-[350px] animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-sm">Loading charts...</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-6 h-[350px] animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-sm">Loading charts...</span>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Budget vs Expense Chart */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Monthly Budget vs Expense</CardTitle>
          <CardDescription className="text-xs text-slate-500">Comparison of allocated budget vs actual spending this month.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsExpenseData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), "Amount"]} 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }}
                  labelStyle={{ fontWeight: "600", color: "#0f172a" }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {budgetVsExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Expense Trend</CardTitle>
          <CardDescription className="text-xs text-slate-500">Overview of expenses across all months of the current year.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), "Total Spend"]} 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }}
                  labelStyle={{ fontWeight: "600", color: "#0f172a" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#0ea5e9" // Sky-500
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
