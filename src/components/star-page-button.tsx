"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setDefaultLandingPage } from "@/services/auth-actions";

interface StarPageButtonProps {
  pagePath: "/dashboard" | "/expenses";
  pageName: string;
}

export function StarPageButton({ pagePath, pageName }: StarPageButtonProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const landing = localStorage.getItem("default_landing_page") || "/dashboard";
    setIsStarred(landing === pagePath);
  }, [pagePath]);

  const handleToggleStar = async () => {
    const newPath = isStarred ? "/dashboard" : pagePath;
    
    // Update local state and storage instantly
    localStorage.setItem("default_landing_page", newPath);
    document.cookie = `default_landing_page=${newPath}; path=/; max-age=${60*60*24*365}; SameSite=Lax`;
    setIsStarred(!isStarred);
    window.dispatchEvent(new Event("storage"));

    try {
      const result = await setDefaultLandingPage(newPath);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isStarred
            ? `Removed ${pageName} as default page.`
            : `Set ${pageName} as your default homepage!`
        );
      }
    } catch {
      toast.error("Failed to save homepage preference to database.");
    }
  };

  // Listen for storage changes in case another page changes the default
  useEffect(() => {
    const handleStorageChange = () => {
      const landing = localStorage.getItem("default_landing_page") || "/dashboard";
      setIsStarred(landing === pagePath);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pagePath]);

  if (!mounted) {
    return (
      <div className="h-7 w-7 rounded-lg border border-slate-100 bg-slate-50/50 animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleStar}
      className={cn(
        "p-1.5 rounded-lg border transition-all duration-200 cursor-pointer shrink-0",
        isStarred
          ? "border-amber-200 bg-amber-50/30 text-amber-500 shadow-3xs"
          : "border-slate-200 bg-white text-slate-400 hover:text-amber-500 hover:border-amber-250 hover:bg-amber-50/10"
      )}
      title={isStarred ? "Current default homepage" : "Set as default homepage"}
    >
      <Star className={cn("h-3.5 w-3.5 transition-transform active:scale-90", isStarred && "fill-amber-500")} />
    </button>
  );
}
