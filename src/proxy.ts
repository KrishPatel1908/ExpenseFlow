import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultLandingPage = request.cookies.get("default_landing_page")?.value || "/dashboard";
  const url = request.nextUrl.clone();

  const isDashboardRoute = 
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/expenses") ||
    url.pathname.startsWith("/alerts");

  const isLoginRoute = url.pathname === "/login";
  const isRootRoute = url.pathname === "/";

  // Protecting dashboard routes
  if (isDashboardRoute && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirecting logged-in users from login page
  if (isLoginRoute && user) {
    url.pathname = defaultLandingPage;
    return NextResponse.redirect(url);
  }

  // Redirecting root path
  if (isRootRoute) {
    url.pathname = user ? defaultLandingPage : "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
