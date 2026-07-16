import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, seedInitialAdmin } from "@/lib/admin";
import { signJWT } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Run self-healing seed first
    await seedInitialAdmin();

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username.trim().toLowerCase()))
      .limit(1);

    if (!admin || admin.password !== hashed) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = await signJWT({ userId: admin.id, username: admin.username });

    const response = NextResponse.json({ success: true, message: "Logged in successfully" });
    
    // Set cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
