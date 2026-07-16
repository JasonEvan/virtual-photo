import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/admin";
import { verifyJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token || !(await verifyJWT(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        id: admins.id,
        username: admins.username,
        createdAt: admins.createdAt,
      })
      .from(admins);

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("GET admins error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1];

    if (!token || !(await verifyJWT(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const [existing] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, cleanUsername))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Username sudah terdaftar" }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const [newAdmin] = await db
      .insert(admins)
      .values({
        username: cleanUsername,
        password: hashed,
      })
      .returning({
        id: admins.id,
        username: admins.username,
        createdAt: admins.createdAt,
      });

    return NextResponse.json(newAdmin);
  } catch (err: any) {
    console.error("POST admin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
