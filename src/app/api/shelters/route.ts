import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const shelters = CrisisStore.getShelters();
  return NextResponse.json({ success: true, data: shelters });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = CrisisStore.createShelter(body);
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
    const updated = CrisisStore.updateShelterOccupancy(
      body.id,
      body.currentOccupancy,
      body.status,
      body.actorName,
      body.actorRole
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Shelter not found" },
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
