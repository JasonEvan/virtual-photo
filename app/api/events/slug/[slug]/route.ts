import { NextResponse } from "next/server";
import { getEventBySlug, upsertEventDetail, createGuests, countGuestsByEventId } from "@/lib/events";
import { storage, BUCKET } from "@/lib/supabase";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

async function uploadFile(
  file: File,
  eventId: string,
  field: string,
  oldUrl?: string | null
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "png";
  const path = `${eventId}/${field}-${Date.now()}.${ext}`;

  // If there's an old file with a different path/extension, delete it first
  if (oldUrl) {
    const searchStr = `/public/${BUCKET}/`;
    const idx = oldUrl.indexOf(searchStr);
    if (idx !== -1) {
      const oldPath = decodeURIComponent(oldUrl.substring(idx + searchStr.length));
      if (oldPath !== path) {
        try {
          await storage.from(BUCKET).remove([oldPath]);
        } catch (err) {
          console.error("Failed to delete old file:", err);
        }
      }
    }
  }

  const { error } = await storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  const { data } = storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const heroFile = formData.get("heroImage") as File | null;
  const frameFile = formData.get("frameImage") as File | null;
  const coupleNames = formData.get("coupleNames") as string | null;
  const tagline = formData.get("tagline") as string | null;
  const maxPhotosStr = formData.get("maxPhotos") as string | null;

  let heroUrl: string | null = event.detail?.heroImage ?? null;
  let frameUrl: string | null = event.detail?.frameImage ?? null;

  if (heroFile && heroFile.size > 0) {
    heroUrl = await uploadFile(heroFile, event.id, "hero", event.detail?.heroImage);
  }
  if (frameFile && frameFile.size > 0) {
    frameUrl = await uploadFile(frameFile, event.id, "frame", event.detail?.frameImage);
  }

  const maxPhotos = maxPhotosStr ? parseInt(maxPhotosStr, 10) : event.detail?.maxPhotos ?? 2;

  const detail = await upsertEventDetail(event.id, {
    heroImage: heroUrl,
    frameImage: frameUrl,
    coupleNames: coupleNames ?? event.detail?.coupleNames ?? null,
    tagline: tagline ?? event.detail?.tagline ?? null,
    maxPhotos,
  });

  return NextResponse.json({ ...event, detail });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const numGuests = body.numGuests as number | null;

  if (numGuests !== null && numGuests > 0) {
    const existing = await countGuestsByEventId(event.id);
    if (numGuests < existing) {
      return NextResponse.json(
        { error: `Jumlah tamu tidak boleh kurang dari ${existing} (sudah terdaftar)` },
        { status: 400 }
      );
    }
    if (numGuests > existing) {
      const chancesLeft = event.detail?.maxPhotos ?? 2;
      await createGuests(event.id, numGuests - existing, chancesLeft);
    }
  }

  const detail = await upsertEventDetail(event.id, { numGuests });

  return NextResponse.json({ ...event, detail });
}
