import { NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const logs = CrisisStore.getAuditLogs();
  return NextResponse.json({ success: true, data: logs });
}
