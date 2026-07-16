import { db } from "./db";
import { admins } from "./db/schema";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function seedInitialAdmin() {
  try {
    const existing = await db.select().from(admins).limit(1);
    if (existing.length === 0) {
      const hashed = hashPassword("admin123");
      await db.insert(admins).values({
        username: "admin",
        password: hashed,
      });
      console.log("Seeded initial admin user: admin / admin123");
    }
  } catch (err) {
    console.error("Failed to seed initial admin:", err);
  }
}
