import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guestPhotos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { storage, BUCKET } from "@/lib/supabase";
import { ZipArchive } from "archiver";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    // 1. Fetch guest photo details
    const [photo] = await db
      .select()
      .from(guestPhotos)
      .where(eq(guestPhotos.id, id))
      .limit(1);

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 2. Fetch the picture from Supabase storage
    const { data: picData, error: picError } = await storage
      .from(BUCKET)
      .download(photo.picturePath);

    if (picError || !picData) {
      console.error("Failed to download picture from storage:", picError);
      return NextResponse.json({ error: "Failed to retrieve picture" }, { status: 500 });
    }

    // Convert picture blob to Buffer
    const picBuffer = Buffer.from(await picData.arrayBuffer());

    const archive = new ZipArchive({ zlib: { level: 9 } });

    // Append picture
    const picExt = photo.picturePath.split(".").pop() || "jpg";
    archive.append(picBuffer, { name: `foto.${picExt}` });

    // Append notes text file
    const safeNotes = photo.notes || "";
    archive.append(`Nama Pengirim: ${photo.guestName}\n\nUcapan:\n${safeNotes}`, {
      name: "ucapan.txt",
    });

    // Append voice note if exists
    if (photo.voicePath) {
      if (photo.voicePath.startsWith("data:")) {
        // Parse base64
        const parts = photo.voicePath.split(",");
        const base64Data = parts[1];
        const mime = parts[0].split(";")[0].split(":")[1] || "audio/webm";
        const ext = mime.split("/")[1] || "webm";
        const audioBuffer = Buffer.from(base64Data, "base64");
        archive.append(audioBuffer, { name: `pesan_suara.${ext}` });
      } else {
        // Download legacy storage file
        const { data: voiceData, error: voiceError } = await storage
          .from(BUCKET)
          .download(photo.voicePath);
        if (!voiceError && voiceData) {
          const voiceExt = photo.voicePath.split(".").pop() || "webm";
          const audioBuffer = Buffer.from(await voiceData.arrayBuffer());
          archive.append(audioBuffer, { name: `pesan_suara.${voiceExt}` });
        }
      }
    }

    // Create a native Web ReadableStream from the archiver instance
    const customStream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        archive.on("end", () => {
          controller.close();
        });
        archive.on("error", (err: Error) => {
          controller.error(err);
        });
        archive.finalize();
      }
    });

    // Prepare response header filename
    const safeName = photo.guestName.replace(/[^a-zA-Z0-9]/g, "_") || "guest";
    const filename = `greeting-${safeName}.zip`;

    return new Response(customStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("ZIP download failed:", err);
    return NextResponse.json({ error: "Failed to generate ZIP archive" }, { status: 500 });
  }
}
