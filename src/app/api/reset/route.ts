import { NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cleanState = CrisisStore.reset();
    return NextResponse.json({
      success: true,
      message: "Crisis store reset to clean pristine state successfully.",
      data: {
        requestsCount: cleanState.requests.length,
        incidentsCount: cleanState.incidents.length,
        alertsCount: cleanState.alerts.length,
        sheltersCount: cleanState.shelters.length,
        teamsCount: cleanState.teams.length,
        tasksCount: cleanState.volunteerTasks.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET as well for simple browser or curl trigger
  return POST();
}
