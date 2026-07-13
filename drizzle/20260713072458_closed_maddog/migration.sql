CREATE TABLE "event_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL UNIQUE,
	"hero_image" text,
	"frame_image" text,
	"couple_names" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "hero_image";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "frame_image";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "couple_names";--> statement-breakpoint
ALTER TABLE "event_details" ADD CONSTRAINT "event_details_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;