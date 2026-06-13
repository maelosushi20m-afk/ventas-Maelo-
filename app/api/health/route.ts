import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "maelo-rolls",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
}
