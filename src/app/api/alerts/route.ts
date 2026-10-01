import { NextRequest, NextResponse } from "next/server";
import { CrisisStore } from "@/lib/server/crisis-store";

export async function GET() {
  const alerts = CrisisStore.getAlerts();
  return NextResponse.json({ success: true, data: alerts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a simulation trigger
    if (body.action === "simulate") {
      const sim = CrisisStore.simulateFloodCrisis();
      return NextResponse.json({ success: true, data: sim, simulated: true });
    }

    const created = CrisisStore.createAlert({
      severity: body.severity || "warning",
      title: body.title,
      description: body.description,
      source: body.source || "GHMC State Emergency Operation Centre",
      issuedAt: "Just now",
      expiresAt: "In 24 hours",
      suggestedAction: body.suggestedAction,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      CrisisStore.deleteAlert(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
