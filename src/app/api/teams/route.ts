import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const teams = CrisisStore.getTeams();
  return NextResponse.json({ success: true, data: teams });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = CrisisStore.updateTeamStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = CrisisStore.createTeam(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
