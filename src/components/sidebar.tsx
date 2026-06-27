"use strict";

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Menu, 
  X,
  TrendingUp,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth-actions";
import { toast } from "sonner";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Signed out successfully.");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
          <TrendingUp className="h-5 w-5 text-stone-900" />
          <span>ExpenseFlow</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs transition-opacity lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />
      <aside
        className={cn(
          "fixed bottom-0 top-0 left-0 z-50 w-64 bg-stone-50 border-r border-stone-200 p-4 transition-transform lg:translate-x-0 lg:static lg:flex lg:h-screen lg:flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-10 items-center px-2 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-lg">
            <TrendingUp className="h-5 w-5 text-stone-900" />
            <span>ExpenseFlow</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-stone-900" : "text-stone-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-200 pt-4 mt-auto space-y-2">
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              A
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-stone-900 truncate">Admin User</p>
              <p className="text-xs text-stone-500 truncate">admin@expenseflow.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
