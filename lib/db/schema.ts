import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const packets = pgTable("packets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  hasPhoto: boolean("has_photo").default(true).notNull(),
  hasNotes: boolean("has_notes").default(true).notNull(),
  hasVn: boolean("has_vn").default(false).notNull(),
  hasFilter: boolean("has_filter").default(false).notNull(),
  hasGif: boolean("has_gif").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  packetId: uuid("packet_id").references(() => packets.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventDetails = pgTable("event_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .unique()
    .references(() => events.id, { onDelete: "cascade" }),
  heroImage: text("hero_image"),
  frameImage: text("frame_image"),

  maxPhotos: integer("max_photos").default(2).notNull(),
  numGuests: integer("num_guests"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const guestPhotos = pgTable("guest_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  picturePath: text("picture_path").notNull(),
  guestName: text("guest_name").notNull().default("John Doe"),
  notes: text("notes"),
  voicePath: text("voice_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guests = pgTable("guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  chancesLeft: integer("chances_left").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
