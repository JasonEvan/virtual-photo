import { NextResponse } from "next/server";
import { getEventById, getGuestById } from "@/lib/events";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");
  if (!guestId) {
    return NextResponse.json({ valid: false });
  }

  const guest = await getGuestById(guestId);
  if (!guest || guest.eventId !== event.id) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}
