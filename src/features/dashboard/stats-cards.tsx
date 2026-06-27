import { Users, IndianRupee, Receipt, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalCustomers: number;
    totalMonthlyBudget: number;
    totalMonthlyExpense: number;
    remainingBudget: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const remainingIsNegative = stats.remainingBudget < 0;

  const cardItems = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      iconColor: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "Monthly Budget",
      value: formatCurrency(stats.totalMonthlyBudget),
      icon: IndianRupee,
      iconColor: "text-slate-700 bg-slate-100",
    },
    {
      title: "Monthly Expense",
      value: formatCurrency(stats.totalMonthlyExpense),
      icon: Receipt,
      iconColor: "text-rose-600 bg-rose-50",
    },
    {
      title: "Remaining Budget",
      value: formatCurrency(stats.remainingBudget),
      icon: Wallet,
      iconColor: remainingIsNegative 
        ? "text-rose-600 bg-rose-50" 
        : "text-emerald-600 bg-emerald-50",
      valueColor: remainingIsNegative 
        ? "text-rose-600" 
        : "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cardItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="flex items-center justify-between p-6 border border-slate-200 bg-white shadow-xs">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{item.title}</p>
              <h3 className={cn("text-2xl font-bold tracking-tight", item.valueColor || "text-slate-900")}>
                {item.value}
              </h3>
            </div>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
