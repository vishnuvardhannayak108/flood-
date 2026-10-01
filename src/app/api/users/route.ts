import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const users = CrisisStore.getUsers();
  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = CrisisStore.updateUser(body.id, body.updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User not found" },
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
