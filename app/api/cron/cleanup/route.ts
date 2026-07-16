import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guestPhotos } from "@/lib/db/schema";
import { lt, inArray } from "drizzle-orm";
import { storage, BUCKET } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    // 1. Authenticate the request in production environments
    const authHeader = request.headers.get("Authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Resolve date threshold (older than 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 3. Query matching rows from database
    const oldPhotos = await db
      .select()
      .from(guestPhotos)
      .where(lt(guestPhotos.createdAt, twoWeeksAgo));

    if (oldPhotos.length === 0) {
      return NextResponse.json({ message: "No expired photos found." });
    }

    // ponytail: clean up Supabase storage files and database rows in bulk
    const pathsToDelete: string[] = [];
    for (const photo of oldPhotos) {
      if (photo.picturePath) {
        pathsToDelete.push(photo.picturePath);
      }
      if (photo.voicePath && !photo.voicePath.startsWith("data:")) {
        pathsToDelete.push(photo.voicePath);
      }
    }

    // Delete files in bulk from Supabase Storage
    if (pathsToDelete.length > 0) {
      const { error: storageError } = await storage.from(BUCKET).remove(pathsToDelete);
      if (storageError) {
        console.error("Supabase Storage cleanup error:", storageError.message);
      }
    }

    // Delete database rows in bulk
    const idsToDelete = oldPhotos.map((p) => p.id);
    await db.delete(guestPhotos).where(inArray(guestPhotos.id, idsToDelete));

    return NextResponse.json({
      message: `Cleaned up ${oldPhotos.length} expired photo record(s) successfully.`,
      deletedCount: oldPhotos.length,
    });
  } catch (err: any) {
    console.error("Expired photos cleanup failed:", err);
    return NextResponse.json({ error: "Failed to perform cleanup" }, { status: 500 });
  }
}
