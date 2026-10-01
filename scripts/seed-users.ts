import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-project.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_service_role_key";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_PASSWORD = "Password123!";

const DEMO_USERS = [
  {
    email: "admin@ferrcs.demo",
    full_name: "Operations Commander",
    phone: "+91 91000 00001",
    role: "admin",
    verification_status: "verified",
  },
  {
    email: "citizen1@ferrcs.demo",
    full_name: "Priya Sharma",
    phone: "+91 91000 00002",
    role: "citizen",
    verification_status: "verified",
  },
  {
    email: "citizen2@ferrcs.demo",
    full_name: "Ravi Teja",
    phone: "+91 91000 00003",
    role: "citizen",
    verification_status: "verified",
  },
  {
    email: "rescue1@ferrcs.demo",
    full_name: "Captain Vikram (Team Alpha)",
    phone: "+91 91000 00004",
    role: "rescue_team",
    verification_status: "verified",
  },
  {
    email: "rescue2@ferrcs.demo",
    full_name: "Officer Sunita (Team Bravo)",
    phone: "+91 91000 00005",
    role: "rescue_team",
    verification_status: "verified",
  },
  {
    email: "volunteer1@ferrcs.demo",
    full_name: "Anand Reddy",
    phone: "+91 91000 00006",
    role: "volunteer",
    verification_status: "verified",
  },
];

async function seedDemoUsers() {
  console.log("🌊 FERRCS: Seeding Demo Users...");

  if (supabaseUrl.includes("dummy-project")) {
    console.log("ℹ️ In offline/demo mode without connected Supabase Cloud project.");
    console.log("Pre-configured demo users are ready for 1-click login in the UI:");
    DEMO_USERS.forEach((u) => {
      console.log(` • [${u.role.toUpperCase()}] ${u.email} (Password: ${DEMO_PASSWORD})`);
    });
    return;
  }

  for (const user of DEMO_USERS) {
    try {
      // 1. Create or retrieve auth user
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      });

      let userId = authUser?.user?.id;

      if (authError) {
        if (authError.message.includes("already registered")) {
          console.log(`✓ User ${user.email} already registered in Auth.`);
          // Fetch existing user id
          const { data: listData } = await adminClient.auth.admin.listUsers();
          const existing = listData?.users.find((u) => u.email === user.email);
          userId = existing?.id;
        } else {
          console.error(`Error creating ${user.email}:`, authError.message);
          continue;
        }
      }

      if (userId) {
        // 2. Ensure profile matches desired role & verification_status
        const { error: profileError } = await adminClient.from("profiles").upsert({
          id: userId,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role as any,
          verification_status: user.verification_status as any,
          preferred_language: "en",
        });

        if (profileError) {
          console.error(`Profile error for ${user.email}:`, profileError.message);
        } else {
          console.log(`✓ Configured profile for ${user.email} [${user.role}]`);
        }

        // 3. If rescue team, create team entry and membership
        if (user.role === "rescue_team") {
          const teamName = user.email.includes("rescue1") ? "Team Alpha" : "Team Bravo";
          const { data: teamData } = await adminClient
            .from("rescue_teams")
            .upsert({
              name: teamName,
              organization: "State Disaster Response Force (SDRF)",
              contact_phone: user.phone,
              capacity: 6,
              vehicle_type: "Motorized Inflatable Boat",
              status: "available",
              verification_status: "verified",
            })
            .select()
            .single();

          if (teamData) {
            await adminClient.from("rescue_team_members").upsert({
              team_id: teamData.id,
              user_id: userId,
              is_leader: true,
            });
          }
        }
      }
    } catch (err: any) {
      console.error(`Unexpected error for ${user.email}:`, err.message);
    }
  }

  console.log("✅ Seeding complete.");
}

seedDemoUsers();
