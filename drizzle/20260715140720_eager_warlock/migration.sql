CREATE TABLE "packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"has_photo" boolean DEFAULT true NOT NULL,
	"has_notes" boolean DEFAULT true NOT NULL,
	"has_vn" boolean DEFAULT false NOT NULL,
	"has_filter" boolean DEFAULT false NOT NULL,
	"has_gif" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "packet_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_packet_id_packets_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "packets"("id");