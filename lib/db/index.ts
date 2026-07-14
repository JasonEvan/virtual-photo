import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dns from "node:dns";

dns.setDefaultResultOrder('ipv4first');

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

// @ts-expect-error - drizzle-orm RC type issue with schema option
export const db = drizzle({ client, schema });
