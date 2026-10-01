import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const req = CrisisStore.getRequestById(params.id);
  if (!req) {
    return NextResponse.json(
      { success: false, error: "Request not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: req });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = CrisisStore.updateRequestStatus(
      params.id,
      body.status,
      body.note,
      body.actorName,
      body.actorRole,
      body.assignedTeam
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
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
