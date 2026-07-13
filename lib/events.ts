import { eq } from "drizzle-orm";
import { db } from "./db";
import { events, eventDetails } from "./db/schema";

export type Event = typeof events.$inferSelect;
export type EventDetail = typeof eventDetails.$inferSelect;
export type EventWithDetail = Event & { detail: EventDetail | null };

export async function getAllEvents(): Promise<EventWithDetail[]> {
  const rows = await db.select().from(events).leftJoin(eventDetails, eq(events.id, eventDetails.eventId));
  return rows.map((row) => ({
    ...row.events,
    detail: row.event_details,
  }));
}

export async function getEventById(id: string): Promise<EventWithDetail | undefined> {
  const rows = await db.select().from(events).leftJoin(eventDetails, eq(events.id, eventDetails.eventId)).where(eq(events.id, id));
  const row = rows[0];
  if (!row) return undefined;
  return { ...row.events, detail: row.event_details };
}

export async function getEventBySlug(slug: string): Promise<EventWithDetail | undefined> {
  const rows = await db.select().from(events).leftJoin(eventDetails, eq(events.id, eventDetails.eventId)).where(eq(events.slug, slug));
  const row = rows[0];
  if (!row) return undefined;
  return { ...row.events, detail: row.event_details };
}

export async function createEvent(data: {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
}): Promise<Event> {
  const [event] = await db.insert(events).values({
    name: data.name,
    slug: data.slug,
    startDate: data.startDate,
    endDate: data.endDate,
  }).returning();
  return event;
}

export async function upsertEventDetail(
  eventId: string,
  data: {
    heroImage?: string | null;
    frameImage?: string | null;
    coupleNames?: string | null;
    tagline?: string | null;
    maxPhotos?: number;
  }
): Promise<EventDetail> {
  const [existing] = await db.select().from(eventDetails).where(eq(eventDetails.eventId, eventId));
  if (existing) {
    const [updated] = await db.update(eventDetails)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(eventDetails.eventId, eventId))
      .returning();
    return updated;
  }
  const [created] = await db.insert(eventDetails)
    .values({ eventId, ...data })
    .returning();
  return created;
}

export async function updateEvent(
  id: string,
  data: Partial<Pick<Event, "name" | "slug" | "startDate" | "endDate">>
): Promise<Event | null> {
  const [updated] = await db.update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const deleted = await db.delete(events).where(eq(events.id, id)).returning();
  return deleted.length > 0;
}
