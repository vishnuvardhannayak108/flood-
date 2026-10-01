import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DEMO_PASSWORD = "Password123!";

const FALLBACK_USERS = [
  {
    email: "admin@ferrcs.demo",
    role: "admin",
    fullName: "Operations Commander",
    phone: "+91 91000 00001",
    password: DEMO_PASSWORD,
  },
  {
    email: "rescue1@ferrcs.demo",
    role: "rescue_team",
    fullName: "Captain Vikram (Team Alpha)",
    phone: "+91 91000 00004",
    password: DEMO_PASSWORD,
  },
  {
    email: "rescue2@ferrcs.demo",
    role: "rescue_team",
    fullName: "Officer Sunita (Team Bravo)",
    phone: "+91 91000 00005",
    password: DEMO_PASSWORD,
  },
  {
    email: "citizen1@ferrcs.demo",
    role: "citizen",
    fullName: "Priya Sharma",
    phone: "+91 91000 00002",
    password: DEMO_PASSWORD,
  },
  {
    email: "citizen2@ferrcs.demo",
    role: "citizen",
    fullName: "Ravi Teja",
    phone: "+91 91000 00003",
    password: DEMO_PASSWORD,
  },
  {
    email: "volunteer1@ferrcs.demo",
    role: "volunteer",
    fullName: "Anand Reddy",
    phone: "+91 91000 00006",
    password: DEMO_PASSWORD,
  },
];

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("dummy-project")) {
    return NextResponse.json({
      success: true,
      source: "fallback",
      users: FALLBACK_USERS,
    });
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error || !data?.users) {
      console.warn("Could not list users from Supabase admin API:", error?.message);
      return NextResponse.json({
        success: true,
        source: "fallback",
        users: FALLBACK_USERS,
      });
    }

    const liveUsers = data.users.map((u) => {
      const metadata = (u.user_metadata || {}) as Record<string, any>;
      const role =
        metadata.role ||
        (u.email?.includes("admin")
          ? "admin"
          : u.email?.includes("rescue")
          ? "rescue_team"
          : u.email?.includes("volunteer")
          ? "volunteer"
          : "citizen");

      return {
        id: u.id,
        email: u.email || "",
        role,
        fullName: metadata.full_name || (u.email ? u.email.split("@")[0] : "User"),
        phone: metadata.phone || u.phone || "",
        password: DEMO_PASSWORD,
        createdAt: u.created_at,
      };
    });

    // Sort by role: admin, rescue_team, volunteer, citizen
    const roleOrder: Record<string, number> = {
      admin: 1,
      rescue_team: 2,
      volunteer: 3,
      citizen: 4,
    };

    liveUsers.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

    return NextResponse.json({
      success: true,
      source: "supabase_live",
      users: liveUsers,
    });
  } catch (err) {
    console.error("Failed to fetch Supabase users:", err);
    return NextResponse.json({
      success: true,
      source: "fallback",
      users: FALLBACK_USERS,
    });
  }
}
