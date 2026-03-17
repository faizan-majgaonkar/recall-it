ALTER TABLE "document_chunks" ADD COLUMN "heading_level" integer;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "is_full_section" boolean DEFAULT false NOT NULL;