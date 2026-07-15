import { NextResponse } from "next/server";
import {
  getEventById,
  createGuestPhoto,
  getGuestPhotosByEventId,
  decrementGuestChances,
} from "@/lib/events";
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
    const { data: picData } = storage
      .from(BUCKET)
      .getPublicUrl(row.picturePath);
    let voiceUrl: string | null = null;
    if (row.voicePath) {
      if (row.voicePath.startsWith("data:")) {
        voiceUrl = row.voicePath;
      } else {
        const { data: voiceData } = storage
          .from(BUCKET)
          .getPublicUrl(row.voicePath);
        voiceUrl = voiceData.publicUrl;
      }
    }
    return { ...row, pictureUrl: picData.publicUrl, voiceUrl };
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
  const guestId = formData.get("guestId") as string | null;
  const voiceBase64 = formData.get("voiceBase64") as string | null;

  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  }

  const ext = photo.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const pathName = `${id}/guests/${filename}`;

  const { error } = await storage.from(BUCKET).upload(pathName, photo, {
    contentType: photo.type,
  });
  if (error) {
    console.error("Upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const row = await createGuestPhoto({
    eventId: event.id,
    picturePath: pathName,
    guestName,
    notes,
    voicePath: voiceBase64, // Save Base64 string directly in database
  });

  if (guestId) {
    await decrementGuestChances(guestId);
  }

  return NextResponse.json(row, { status: 201 });
}
