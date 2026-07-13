import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/lib/events";

export async function GET() {
  const events = await getAllEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug, startDate, endDate } = body;

  if (!name || !slug || !startDate || !endDate) {
    return NextResponse.json(
      { error: "name, slug, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  const event = await createEvent({ name, slug, startDate, endDate });
  return NextResponse.json(event, { status: 201 });
}
