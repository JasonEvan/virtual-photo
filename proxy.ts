import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEventBySlug, getGuestById } from "./lib/events";

const INVALID_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tautan tidak valid</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #F7F3ED;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #1C1815;
    }
    .card { text-align: center; max-width: 300px; }
    .icon {
      width: 72px; height: 72px; margin: 0 auto 20px;
      border-radius: 50%; background: #EDE8DF;
      display: flex; align-items: center; justify-content: center;
    }
    .icon svg { width: 32px; height: 32px; color: #8B7E6E; }
    .title { font-size: 17px; font-weight: 500; margin-bottom: 8px; }
    .desc { font-size: 13px; color: #8B7E6E; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 19.5h.75v.75h-.75v-.75Z" />
      </svg>
    </div>
    <div class="title">Tautan tidak valid</div>
    <div class="desc">Silakan kunjungi website ini melalui pemindaian QR code yang diberikan oleh admin.</div>
  </div>
</body>
</html>`;

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const slug = pathname.split("/").filter(Boolean)[0];
  if (!slug) return NextResponse.next();

  const guestId = searchParams.get("guest");
  if (!guestId || !isValidUUID(guestId)) {
    return new NextResponse(INVALID_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const event = await getEventBySlug(slug);
  if (!event) {
    return new NextResponse(INVALID_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const guest = await getGuestById(guestId);
  if (!guest || guest.eventId !== event.id) {
    return new NextResponse(INVALID_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|admin|favicon.ico).*)",
  ],
};
