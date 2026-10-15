import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Immediate bypass for assets, API routes, and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/offline" ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  // Protected paths
  const isCitizenPath = pathname.startsWith("/citizen");
  const isRescuePath = pathname.startsWith("/rescue");
  const isAdminPath = pathname.startsWith("/admin");
  const isVolunteerPath = pathname.startsWith("/volunteer");
  const isProtectedPath = isCitizenPath || isRescuePath || isAdminPath || isVolunteerPath;

  if (isProtectedPath) {
    // Create a Supabase client that can read/refresh the session from cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired — required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated — redirect to /login and remember where they wanted to go
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}
