import { NextResponse } from "next/server";
import { getEventById, getGuestsByEventId } from "@/lib/events";
import QRCode from "qrcode";
import { ZipArchive } from "archiver";
import { PassThrough } from "stream";
import sharp from "sharp";
import path from "path";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const guests = await getGuestsByEventId(event.id);
  if (guests.length === 0) {
    return NextResponse.json({ error: "No guests found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const passthrough = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.pipe(passthrough);

  const webReadable = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passthrough.on("end", () => {
        controller.close();
      });
      passthrough.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  const templatePath = path.join(process.cwd(), "public", "Kartu_QR.png");

  for (const guest of guests) {
    const url = `${baseUrl}/${event.slug}?guest=${guest.id}`;
    const qrBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 330,
      margin: 2,
    });

    try {
      const compositeBuffer = await sharp(templatePath)
        .composite([
          {
            input: qrBuffer,
            left: 658,
            top: 217,
          },
        ])
        .toBuffer();
      archive.append(compositeBuffer, { name: `${guest.id}.png` });
    } catch (err) {
      console.error("Failed to generate composite QR image:", err);
      // Fallback to raw QR code if composite fails
      archive.append(qrBuffer, { name: `${guest.id}.png` });
    }
  }

  archive.finalize();

  return new Response(webReadable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qrcodes-${event.slug}.zip"`,
    },
  });
}
