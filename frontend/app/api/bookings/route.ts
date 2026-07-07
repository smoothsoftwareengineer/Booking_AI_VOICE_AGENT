import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/bookings`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("bookings fetch failed:", res.status, detail);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("bookings proxy error:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
