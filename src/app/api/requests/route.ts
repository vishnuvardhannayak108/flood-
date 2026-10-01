import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const urgency = searchParams.get("urgency") || undefined;

  const data = CrisisStore.getRequests({ status, urgency });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newReq = CrisisStore.createRequest({
      lat: body.lat || 17.385,
      lng: body.lng || 78.4867,
      phone: body.phone,
      citizenName: body.citizenName,
      peopleCount: body.peopleCount || 1,
      hasVulnerable: !!body.hasVulnerable,
      urgency: body.urgency || "critical",
      type: body.type || "Trapped / Flood Evacuation",
      description: body.description || "Immediate emergency assistance required",
      address: body.address,
    });

    return NextResponse.json({ success: true, data: newReq });
  } catch (error) {
    console.error("Error creating SOS request:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
