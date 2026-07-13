import { NextResponse } from "next/server";
import { getEventBySlug, updateEvent } from "@/lib/events";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const body = await request.json();
  const updated = updateEvent(event.id, body);
  return NextResponse.json(updated);
}
