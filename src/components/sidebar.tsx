"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Star
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
    name: "Transactions",
    href: "/expenses",
    icon: Receipt,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [starredPath, setStarredPath] = useState("/dashboard");

  // Load and sync starred homepage preference
  useEffect(() => {
    const landing = localStorage.getItem("default_landing_page") || "/dashboard";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStarredPath(landing);
    document.cookie = `default_landing_page=${landing}; path=/; max-age=${60*60*24*365}; SameSite=Lax`;

    const handleStorageChange = () => {
      const updatedLanding = localStorage.getItem("default_landing_page") || "/dashboard";
      setStarredPath(updatedLanding);
      document.cookie = `default_landing_page=${updatedLanding}; path=/; max-age=${60*60*24*365}; SameSite=Lax`;
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleToggleStar = (path: string, name: string) => {
    localStorage.setItem("default_landing_page", path);
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `default_landing_page=${path}; path=/; max-age=${60*60*24*365}; SameSite=Lax`;
    setStarredPath(path);
    toast.success(`Set ${name} as your default homepage!`);
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("has_redirected");
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
      <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight">
          <TrendingUp className="h-7 w-7 text-blue-600" />
          <span className="text-slate-900 font-extrabold text-base">ExpenseFlow</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />
      <aside
        className={cn(
          "fixed bottom-0 top-0 left-0 z-50 w-64 bg-white border-r border-slate-100 p-5 transition-transform flex h-screen flex-col lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo and branding */}
        <div className="flex flex-col px-2 mb-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold tracking-tight text-[#0b132a]">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-[#0b132a] font-black text-xl tracking-tight">ExpenseFlow</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const isStarred = starredPath === item.href;
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg transition-all duration-200",
                  isActive ? "bg-blue-50/70" : "hover:bg-slate-50"
                )}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.name}</span>
                </Link>

                {/* Star Button on the right side of the nav row */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleStar(item.href, item.name);
                  }}
                  className={cn(
                    "p-1.5 mr-2 rounded-md transition-all duration-200 cursor-pointer shrink-0",
                    isStarred 
                      ? "text-amber-500" 
                      : "text-slate-300 hover:text-amber-500 hover:bg-slate-150/50"
                  )}
                  title={isStarred ? "Current default homepage" : `Set ${item.name} as default homepage`}
                >
                  <Star className={cn("h-3.5 w-3.5 transition-transform active:scale-90", isStarred && "fill-amber-500")} />
                </button>
              </div>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-1 py-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b132a] text-xs font-bold text-white shadow-sm shrink-0">
              AD
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-xs font-extrabold text-slate-800 truncate">Admin User</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">admin@gmail.com</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md py-2 px-3 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
          <div className="h-4 lg:h-0" />
        </div>
      </aside>
    </>
  );
}
