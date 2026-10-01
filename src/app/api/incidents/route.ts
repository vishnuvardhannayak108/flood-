import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const incidents = CrisisStore.getIncidents();
  return NextResponse.json({ success: true, data: incidents });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = CrisisStore.createIncident({
      title: body.title,
      description: body.description,
      waterLevelCm: Number(body.waterLevelCm) || 0,
      locationName: body.locationName || "Reported Location",
      lat: Number(body.lat) || 17.385,
      lng: Number(body.lng) || 78.4867,
      reporterName: body.reporterName || "Local Citizen",
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = CrisisStore.updateIncidentStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Incident not found" },
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
