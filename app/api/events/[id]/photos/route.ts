import { NextResponse } from "next/server";
import { getEventById, createGuestPhoto, getGuestPhotosByEventId } from "@/lib/events";
import { storage, BUCKET } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const rows = await getGuestPhotosByEventId(event.id);
  const photos = rows.map((row) => {
    const { data } = storage.from(BUCKET).getPublicUrl(row.picturePath);
    return { ...row, pictureUrl: data.publicUrl };
  });

  return NextResponse.json(photos);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const guestName = (formData.get("guestName") as string) || "John Doe";
  const notes = formData.get("notes") as string | null;

  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  }

  const ext = photo.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${id}/guests/${filename}`;

  const { error } = await storage.from(BUCKET).upload(path, photo, {
    contentType: photo.type,
  });
  if (error) {
    console.error("Upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const row = await createGuestPhoto({
    eventId: event.id,
    picturePath: path,
    guestName,
    notes,
  });

  return NextResponse.json(row, { status: 201 });
}
