import { NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/events";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const { name, slug, startDate, endDate } = body;

  const event = await updateEvent(id, { name, slug, startDate, endDate });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const success = await deleteEvent(id);
  if (!success) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
