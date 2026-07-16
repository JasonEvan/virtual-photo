import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "./db";
import { events, eventDetails, guestPhotos, guests, packets } from "./db/schema";

export type Event = typeof events.$inferSelect;
export type EventDetail = typeof eventDetails.$inferSelect;
export type Packet = typeof packets.$inferSelect;
export type EventWithDetail = Event & {
  detail: EventDetail | null;
  packet: Packet | null;
};
export type GuestPhoto = typeof guestPhotos.$inferSelect;
export type Guest = typeof guests.$inferSelect;

export async function getAllEvents(): Promise<EventWithDetail[]> {
  const rows = await db
    .select()
    .from(events)
    .leftJoin(eventDetails, eq(events.id, eventDetails.eventId))
    .leftJoin(packets, eq(events.packetId, packets.id));
  return rows.map((row) => ({
    ...row.events,
    detail: row.event_details,
    packet: row.packets,
  }));
}

export async function getEventById(
  id: string,
): Promise<EventWithDetail | undefined> {
  const rows = await db
    .select()
    .from(events)
    .leftJoin(eventDetails, eq(events.id, eventDetails.eventId))
    .leftJoin(packets, eq(events.packetId, packets.id))
    .where(eq(events.id, id));
  const row = rows[0];
  if (!row) return undefined;
  return { ...row.events, detail: row.event_details, packet: row.packets };
}

export async function getEventBySlug(
  slug: string,
): Promise<EventWithDetail | undefined> {
  const rows = await db
    .select()
    .from(events)
    .leftJoin(eventDetails, eq(events.id, eventDetails.eventId))
    .leftJoin(packets, eq(events.packetId, packets.id))
    .where(eq(events.slug, slug));
  const row = rows[0];
  if (!row) return undefined;
  return { ...row.events, detail: row.event_details, packet: row.packets };
}

export async function createEvent(data: {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  packetId?: string | null;
}): Promise<Event> {
  const [event] = await db
    .insert(events)
    .values({
      name: data.name,
      slug: data.slug,
      startDate: data.startDate,
      endDate: data.endDate,
      packetId: data.packetId ?? null,
    })
    .returning();
  return event;
}

export async function upsertEventDetail(
  eventId: string,
  data: {
    heroImage?: string | null;
    frameImage?: string | null;
    frameImage11?: string | null;
    frameImage34?: string | null;
    frameImage169?: string | null;
    maxPhotos?: number;
    numGuests?: number | null;
  },
): Promise<EventDetail> {
  const [existing] = await db
    .select()
    .from(eventDetails)
    .where(eq(eventDetails.eventId, eventId));
  if (existing) {
    const [updated] = await db
      .update(eventDetails)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(eventDetails.eventId, eventId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(eventDetails)
    .values({ eventId, ...data })
    .returning();
  return created;
}

export async function updateEvent(
  id: string,
  data: Partial<Pick<Event, "name" | "slug" | "startDate" | "endDate" | "packetId">>,
): Promise<Event | null> {
  const [updated] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const deleted = await db.delete(events).where(eq(events.id, id)).returning();
  return deleted.length > 0;
}

export async function createGuestPhoto(data: {
  eventId: string;
  picturePath: string;
  guestName: string;
  notes?: string | null;
  voicePath?: string | null;
}): Promise<GuestPhoto> {
  const [row] = await db
    .insert(guestPhotos)
    .values({
      eventId: data.eventId,
      picturePath: data.picturePath,
      guestName: data.guestName,
      notes: data.notes ?? null,
      voicePath: data.voicePath ?? null,
    })
    .returning();
  return row;
}

export async function getGuestPhotosByEventId(
  eventId: string,
  limitVal?: number,
): Promise<GuestPhoto[]> {
  const query = db
    .select()
    .from(guestPhotos)
    .where(eq(guestPhotos.eventId, eventId))
    .orderBy(desc(guestPhotos.createdAt));

  if (limitVal !== undefined) {
    return query.limit(limitVal);
  }
  return query;
}

export async function createGuests(
  eventId: string,
  count: number,
  chancesLeft: number,
): Promise<void> {
  const rows = Array.from({ length: count }, () => ({
    eventId,
    chancesLeft,
  }));
  await db.insert(guests).values(rows);
}

export async function countGuestsByEventId(eventId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(guests)
    .where(eq(guests.eventId, eventId));
  return row?.value ?? 0;
}

export async function deleteGuestsByEventId(eventId: string): Promise<void> {
  await db.delete(guests).where(eq(guests.eventId, eventId));
}

export async function getGuestsByEventId(eventId: string): Promise<Guest[]> {
  return db.select().from(guests).where(eq(guests.eventId, eventId));
}

export async function getGuestById(
  guestId: string,
): Promise<Guest | undefined> {
  const [row] = await db.select().from(guests).where(eq(guests.id, guestId));
  return row;
}

export async function decrementGuestChances(
  guestId: string,
): Promise<Guest | undefined> {
  const [row] = await db
    .update(guests)
    .set({ chancesLeft: sql`${guests.chancesLeft} - 1` })
    .where(eq(guests.id, guestId))
    .returning();
  return row;
}

export async function seedPackets(): Promise<void> {
  console.log("[DB] seedPackets: Checking packets table...");
  const rows = await db.select().from(packets).limit(1);
  console.log("[DB] seedPackets: Found packets count:", rows.length);
  if (rows.length === 0) {
    console.log("[DB] seedPackets: Seeding packets...");
    await db.insert(packets).values([
      { name: "Paket 1: Foto, Ucapan", hasPhoto: true, hasNotes: true, hasVn: false, hasFilter: false, hasGif: false },
      { name: "Paket 2: Foto, Ucapan, VN", hasPhoto: true, hasNotes: true, hasVn: true, hasFilter: false, hasGif: false },
      { name: "Paket 3: Foto, Ucapan, VN, Filter", hasPhoto: true, hasNotes: true, hasVn: true, hasFilter: true, hasGif: false },
      { name: "Paket 4: Foto, Ucapan, VN, Filter, GIF", hasPhoto: true, hasNotes: true, hasVn: true, hasFilter: true, hasGif: true },
    ]);
    console.log("[DB] seedPackets: Seeding completed.");
  }
}

export async function getAllPackets(): Promise<Packet[]> {
  console.log("[DB] getAllPackets: Fetching all packets...");
  await seedPackets();
  const result = await db.select().from(packets).orderBy(packets.name);
  console.log("[DB] getAllPackets: Returned packets:", result.length);
  return result;
}
