CREATE TABLE "user_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blockerId" integer NOT NULL,
	"blockedId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "reportedUserId" integer;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_users_id_fk" FOREIGN KEY ("blockerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_users_id_fk" FOREIGN KEY ("blockedId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_blocks_pair" ON "user_blocks" USING btree ("blockerId","blockedId");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_users_id_fk" FOREIGN KEY ("reportedUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;