import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { getEventById, getGuestById, getGuestPhotosByEventId } from "@/lib/events";
import { storage, BUCKET } from "@/lib/supabase";

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guest");

    if (!eventId || !isValidUUID(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    if (!guestId || !isValidUUID(guestId)) {
      return NextResponse.json({ error: "Invalid guest ID" }, { status: 400 });
    }

    // 1. Verify event exists
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Verify guest belongs to this event
    const guest = await getGuestById(guestId);
    if (!guest || guest.eventId !== eventId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 3. Fetch all photos for this event
    const rows = await getGuestPhotosByEventId(eventId);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No photos to download" }, { status: 400 });
    }

    // Convert paths to public URLs
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

    const archive = new ZipArchive({ zlib: { level: 5 } });

    // 4. Create stream for streaming download response
    const customStream = new ReadableStream({
      async start(controller) {
        archive.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        archive.on("end", () => {
          controller.close();
        });
        archive.on("error", (err: Error) => {
          controller.error(err);
        });

        try {
          const nameCounts: Record<string, number> = {};

          for (const gp of photos) {
            const rawName = gp.guestName || "Tamu";
            const safeName = rawName.replace(/[^a-zA-Z0-9]/g, "_");

            let folderName = safeName;
            if (nameCounts[safeName] !== undefined) {
              nameCounts[safeName]++;
              folderName = `${safeName}_${nameCounts[safeName]}`;
            } else {
              nameCounts[safeName] = 1;
            }

            // A. Add Image file
            if (gp.pictureUrl) {
              try {
                const imgRes = await fetch(gp.pictureUrl);
                if (imgRes.ok) {
                  const mime = imgRes.headers.get("content-type") || "image/jpeg";
                  const ext = (mime.split(";")[0].split("/")[1] || "jpg").trim().replace(/[^a-zA-Z0-9]/g, "");
                  const imgBuf = Buffer.from(await imgRes.arrayBuffer());
                  archive.append(imgBuf, { name: `${folderName}/foto.${ext}` });
                }
              } catch (err) {
                console.error(`Failed to fetch picture for photo ${gp.id}:`, err);
              }
            }

            // B. Add Notes text file
            const notes = gp.notes || "";
            archive.append(`Nama Pengirim: ${gp.guestName || "Tamu"}\n\nUcapan:\n${notes}`, {
              name: `${folderName}/ucapan.txt`,
            });

            // C. Add Voice note if exists
            if (gp.voiceUrl) {
              try {
                const audioRes = await fetch(gp.voiceUrl);
                if (audioRes.ok) {
                  const mime = audioRes.headers.get("content-type") || "audio/webm";
                  const ext = (mime.split(";")[0].split("/")[1] || "webm").trim().replace(/[^a-zA-Z0-9]/g, "");
                  const audioBuf = Buffer.from(await audioRes.arrayBuffer());
                  archive.append(audioBuf, { name: `${folderName}/pesan_suara.${ext}` });
                }
              } catch (err) {
                console.error(`Failed to fetch voice note for photo ${gp.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.error("Error archiving photos stream:", err);
        } finally {
          archive.finalize();
        }
      }
    });

    const safeSlug = event.slug.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `gallery-${safeSlug}-all-greetings.zip`;

    return new Response(customStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Download all gallery greetings failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
