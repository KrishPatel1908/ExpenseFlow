"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Menu,
  X,
  LogOut,
  Star,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { logout, setDefaultLandingPage, changePassword } from "@/services/auth-actions";
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
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
];

interface SidebarProps {
  initialStarredPath?: string;
  user?: {
    email?: string;
    name?: string;
  };
}

export function Sidebar({ initialStarredPath = "/dashboard", user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [starredPath, setStarredPath] = useState(initialStarredPath);

  // Change Password Dialog States
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync starredPath when initialStarredPath changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStarredPath(initialStarredPath);
    localStorage.setItem("default_landing_page", initialStarredPath);
    document.cookie = `default_landing_page=${initialStarredPath}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [initialStarredPath]);

  // Sync with storage changes locally
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedLanding = localStorage.getItem("default_landing_page") || "/dashboard";
      setStarredPath(updatedLanding);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleToggleStar = async (path: string, name: string) => {
    // 1. Instantly update local state and storage
    setStarredPath(path);
    localStorage.setItem("default_landing_page", path);
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `default_landing_page=${path}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.dispatchEvent(new Event("storage"));

    // 2. Persist to database
    try {
      const res = await setDefaultLandingPage(path);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Set ${name} as your default landing page.`);
      }
    } catch {
      toast.error("Failed to update default page preference.");
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Signed out successfully.");
        sessionStorage.removeItem("has_redirected");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password updated successfully!");
        setIsPasswordOpen(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 lg:hidden">
        <Link href="/dashboard" prefetch={false} className="flex items-center gap-2.5 font-bold tracking-tight">
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
          "fixed bottom-0 top-0 left-0 z-50 w-64 bg-white border-r border-slate-100 p-4 lg:p-5 transition-transform flex h-[100dvh] lg:h-screen flex-col lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo and branding */}
        <div className="flex flex-col px-2 mb-5 lg:mb-8">
          <Link href="/dashboard" prefetch={false} className="flex items-center gap-3 font-bold tracking-tight text-[#0b132a]">
            <span className="text-[#0b132a] font-black text-xl tracking-tight">ExpenseFlow</span>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5 lg:space-y-2">
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
                  prefetch={false}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer lg:py-2.5",
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
        <div className="border-t border-slate-100 pt-3 lg:pt-4 mt-auto">
          <div className="flex items-center gap-3 px-1 py-1.5 lg:py-2 mb-2 lg:mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b132a] text-xs font-bold text-white shadow-sm shrink-0 select-none">
              {(() => {
                const email = user?.email || "admin@gmail.com";
                const displayName = user?.name || 
                  email.split("@")[0]
                    .split(/[._-]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ") || 
                  "Admin User";
                return displayName
                  .split(" ")
                  .map(word => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "AD";
              })()}
            </div>
            <div className="overflow-hidden flex-1 leading-tight">
              <p className="text-xs font-extrabold text-slate-800 truncate">
                {user?.name || (user?.email ? (
                  user.email.split("@")[0]
                    .split(/[._-]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                ) : "Admin User")}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate select-all" title={user?.email || "admin@gmail.com"}>
                {user?.email || "admin@gmail.com"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPasswordOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md py-2 px-2.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-slate-400" />
              <span>Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-md py-2 px-2.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
          <div className="h-4 lg:h-0" />
        </div>
      </aside>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl">
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  {"Enter your new password below. Make sure it is secure."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPass" className="text-slate-700 font-bold">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    placeholder="At least 6 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 text-sm"
                    required
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPass" className="text-slate-700 font-bold">Confirm New Password</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    placeholder="Confirm your password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 text-sm"
                    required
                    disabled={isChangingPassword}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={isChangingPassword}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-[#0b132a] hover:bg-[#1a284e] text-white font-semibold cursor-pointer"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
