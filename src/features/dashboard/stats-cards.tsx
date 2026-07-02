import { Users, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalCustomers: number;
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
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

  // Credit remains if Net Balance < 0 (meaning Total Credit > Total Debit)
  const creditRemains = stats.netBalance < 0;

  const cardItems = [
    {
      title: "TOTAL CUSTOMERS",
      value: stats.totalCustomers.toString(),
      icon: Users,
      iconColor: "text-blue-600 bg-blue-50/50 border border-blue-100",
      footer: "Active customer accounts",
      orderClass: "order-1 lg:order-1"
    },
    {
      title: "TOTAL CREDIT",
      value: formatCurrency(stats.totalCredit),
      icon: TrendingDown,
      iconColor: "text-emerald-700 bg-emerald-50/50 border border-emerald-150",
      valueColor: "text-emerald-700",
      footer: "Total credit recorded",
      orderClass: "order-3 lg:order-2"
    },
    {
      title: "TOTAL DEBIT",
      value: formatCurrency(stats.totalDebit),
      icon: TrendingUp,
      iconColor: "text-red-600 bg-red-50/50 border border-red-100",
      valueColor: "text-red-600",
      footer: "Total debit recorded",
      orderClass: "order-4 lg:order-3"
    },
    {
      title: "NET BALANCE",
      value: creditRemains 
        ? formatCurrency(Math.abs(stats.netBalance)) 
        : formatCurrency(-Math.abs(stats.netBalance)),
      icon: Wallet,
      iconColor: creditRemains 
        ? "text-emerald-700 bg-emerald-50/50 border border-emerald-150" 
        : "text-red-600 bg-red-50/50 border border-red-100",
      valueColor: creditRemains ? "text-emerald-700" : "text-red-600",
      footer: "Net credit vs debit balance",
      orderClass: "order-2 lg:order-4"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cardItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card 
            key={index} 
            className={cn(
              "flex flex-col p-4 sm:p-5 border border-slate-100 bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-sm",
              item.orderClass
            )}
          >
            {/* Top row with Icon and Title side-by-side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn("flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg shrink-0 shadow-2xs", item.iconColor)}>
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 tracking-wider uppercase truncate">{item.title}</p>
            </div>

            {/* Bottom area with value and footer */}
            <div className="mt-2 sm:mt-1 space-y-1">
              <h3 className={cn("text-lg sm:text-2xl font-extrabold leading-snug py-0.5", item.valueColor || "text-slate-900")}>
                {item.value}
              </h3>
              {item.footer && (
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium pt-0.5 hidden sm:block">
                  {item.footer}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
