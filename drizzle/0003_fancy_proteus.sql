ALTER TABLE "people" ADD COLUMN "updated_by_email" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "deleted_by_email" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reviewed_by_email" text;