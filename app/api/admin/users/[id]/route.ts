import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/admin";
import { verifyJWT } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const [existingWithUsername] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, cleanUsername))
      .limit(1);

    if (existingWithUsername && existingWithUsername.id !== id) {
      return NextResponse.json({ error: "Username sudah terdaftar" }, { status: 400 });
    }

    const updateData: any = {
      username: cleanUsername,
      updatedAt: new Date(),
    };

    if (password) {
      updateData.password = hashPassword(password);
    }

    const [updated] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, id))
      .returning({
        id: admins.id,
        username: admins.username,
        createdAt: admins.createdAt,
      });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Prevents deleting self
    if (payload.userId === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri" },
        { status: 400 }
      );
    }

    // 2. Prevent deleting if only 1 admin left
    const allAdmins = await db.select().from(admins);
    if (allAdmins.length <= 1) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus admin terakhir di sistem" },
        { status: 400 }
      );
    }

    await db.delete(admins).where(eq(admins.id, id));

    return NextResponse.json({ success: true, message: "Admin deleted successfully" });
  } catch (err: any) {
    console.error("DELETE admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
