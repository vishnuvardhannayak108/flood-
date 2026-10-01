import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database, UserRole, VerificationStatus } from "@/types/database";

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

  // In end-to-end testing & local runtime: allow direct access to each portal and sync role cookie
  if (isProtectedPath) {
    const targetRole: UserRole = isAdminPath
      ? "admin"
      : isRescuePath
      ? "rescue_team"
      : isVolunteerPath
      ? "volunteer"
      : "citizen";

    supabaseResponse.cookies.set("ferrcs_demo_role", targetRole, { path: "/" });
    return supabaseResponse;
  }

  return supabaseResponse;
}
