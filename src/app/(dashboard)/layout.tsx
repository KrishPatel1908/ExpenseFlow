import { Sidebar } from "@/components/sidebar";
import { getDefaultLandingPage } from "@/services/auth-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const defaultLanding = await getDefaultLandingPage();

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-stone-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar initialStarredPath={defaultLanding} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-12 overscroll-none">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
