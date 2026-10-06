CREATE TABLE "typing_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipientId" integer NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(30);--> statement-breakpoint
ALTER TABLE "typing_statuses" ADD CONSTRAINT "typing_statuses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_statuses" ADD CONSTRAINT "typing_statuses_recipientId_users_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "typing_statuses_pair" ON "typing_statuses" USING btree ("userId","recipientId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");