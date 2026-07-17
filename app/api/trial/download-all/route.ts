import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";

interface TrialPhoto {
  pictureUrl: string;
  guestName: string;
  notes: string | null;
  voiceUrl?: string | null;
}

export async function POST(request: Request) {
  try {
    const { photos } = (await request.json()) as { photos: TrialPhoto[] };

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: "Photos array is required" }, { status: 400 });
    }

    const archive = new ZipArchive({ zlib: { level: 5 } });

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

            // 1. Process picture (base64)
            if (gp.pictureUrl && gp.pictureUrl.startsWith("data:")) {
              const parts = gp.pictureUrl.split(",");
              const base64Data = parts[1];
              const mime = parts[0].split(";")[0].split(":")[1] || "image/jpeg";
              const ext = (mime.split(";")[0].split("/")[1] || "jpg").trim().replace(/[^a-zA-Z0-9]/g, "");
              const picBuffer = Buffer.from(base64Data, "base64");
              archive.append(picBuffer, { name: `${folderName}/foto.${ext}` });
            }

            // 2. Append notes text file
            const notes = gp.notes || "";
            archive.append(`Nama Pengirim: ${gp.guestName || "Tamu"}\n\nUcapan:\n${notes}`, {
              name: `${folderName}/ucapan.txt`,
            });

            // 3. Process voice note (base64) if exists
            if (gp.voiceUrl && gp.voiceUrl.startsWith("data:")) {
              const parts = gp.voiceUrl.split(",");
              const base64Data = parts[1];
              const mime = parts[0].split(";")[0].split(":")[1] || "audio/webm";
              const ext = (mime.split(";")[0].split("/")[1] || "webm").trim().replace(/[^a-zA-Z0-9]/g, "");
              const audioBuffer = Buffer.from(base64Data, "base64");
              archive.append(audioBuffer, { name: `${folderName}/pesan_suara.${ext}` });
            }
          }
        } catch (err) {
          console.error("Error zipping trial photos:", err);
        } finally {
          archive.finalize();
        }
      }
    });

    const filename = `gallery-trial-all-greetings.zip`;

    return new Response(customStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Trial download all ZIP generation failed:", err);
    return NextResponse.json({ error: "Failed to generate ZIP archive" }, { status: 500 });
  }
}
