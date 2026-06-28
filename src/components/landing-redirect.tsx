"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LandingRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have already performed the initial redirect in this session
    const hasRedirected = sessionStorage.getItem("has_redirected");
    const landing = localStorage.getItem("default_landing_page");

    if (landing === "/expenses" && !hasRedirected) {
      // Set the session flag so we don't redirect again when navigating back
      sessionStorage.setItem("has_redirected", "true");
      router.replace("/expenses");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-[#0b132a]" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Redirecting to homepage...</p>
      </div>
    );
  }

  return null;
}
