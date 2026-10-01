import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const tasks = CrisisStore.getVolunteerTasks();
  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "complete") {
      const task = CrisisStore.completeVolunteerTask(body.id);
      return NextResponse.json({ success: true, data: task });
    }

    const task = CrisisStore.toggleVolunteerTask(body.id);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
