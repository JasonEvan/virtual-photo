import { NextResponse } from "next/server";
import { getAllPackets } from "@/lib/events";

export async function GET() {
  try {
    const packets = await getAllPackets();
    return NextResponse.json(packets);
  } catch (err) {
    console.error("Failed to fetch packets:", err);
    return NextResponse.json({ error: "Failed to fetch packets" }, { status: 500 });
  }
}
