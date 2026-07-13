import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = join(process.cwd(), "data", "events.json");

function readEvents(): Event[] {
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, "[]", "utf-8");
    return [];
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeEvents(events: Event[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), "utf-8");
}

export function getAllEvents(): Event[] {
  return readEvents();
}

export function getEventById(id: string): Event | undefined {
  return readEvents().find((e) => e.id === id);
}

export function createEvent(data: {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
}): Event {
  const events = readEvents();
  const now = new Date().toISOString();
  const event: Event = {
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: now,
    updatedAt: now,
  };
  events.push(event);
  writeEvents(events);
  return event;
}

export function updateEvent(
  id: string,
  data: Partial<Pick<Event, "name" | "slug" | "startDate" | "endDate">>
): Event | null {
  const events = readEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = {
    ...events[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeEvents(events);
  return events[index];
}

export function deleteEvent(id: string): boolean {
  const events = readEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return false;
  events.splice(index, 1);
  writeEvents(events);
  return true;
}
