ALTER TABLE "submissions" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "ip_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "user_agent" text;--> statement-breakpoint
CREATE INDEX "submissions_ip_hash_submitted_at_idx" ON "submissions" USING btree ("ip_hash","submitted_at");--> statement-breakpoint
CREATE INDEX "submissions_email_submitted_at_idx" ON "submissions" USING btree ("email","submitted_at");