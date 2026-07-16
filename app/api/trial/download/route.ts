import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";

export async function POST(request: Request) {
  try {
    const { pictureUrl, guestName, notes, voiceUrl } = await request.json();

    if (!pictureUrl) {
      return NextResponse.json({ error: "Picture required" }, { status: 400 });
    }

    const archive = new ZipArchive({ zlib: { level: 9 } });

    // 1. Process picture (base64)
    if (pictureUrl.startsWith("data:")) {
      const parts = pictureUrl.split(",");
      const base64Data = parts[1];
      const mime = parts[0].split(";")[0].split(":")[1] || "image/jpeg";
      const ext = mime.split("/")[1] || "jpg";
      const picBuffer = Buffer.from(base64Data, "base64");
      archive.append(picBuffer, { name: `foto.${ext}` });
    } else {
      return NextResponse.json({ error: "Invalid picture format" }, { status: 400 });
    }

    // 2. Append notes text file
    const safeNotes = notes || "";
    archive.append(`Nama Pengirim: ${guestName || "Tamu Uji Coba"}\n\nUcapan:\n${safeNotes}`, {
      name: "ucapan.txt",
    });

    // 3. Process voice note (base64) if exists
    if (voiceUrl && voiceUrl.startsWith("data:")) {
      const parts = voiceUrl.split(",");
      const base64Data = parts[1];
      const mime = parts[0].split(";")[0].split(":")[1] || "audio/webm";
      const ext = mime.split("/")[1] || "webm";
      const audioBuffer = Buffer.from(base64Data, "base64");
      archive.append(audioBuffer, { name: `pesan_suara.${ext}` });
    }

    // 4. Create a native Web ReadableStream from the archiver instance
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
    const safeName = (guestName || "guest").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `greeting-trial-${safeName}.zip`;

    return new Response(customStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Trial ZIP download failed:", err);
    return NextResponse.json({ error: "Failed to generate ZIP archive" }, { status: 500 });
  }
}
