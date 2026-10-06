CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"company" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'offen' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"authorId" integer NOT NULL,
	"caption" text NOT NULL,
	"country" varchar(120) NOT NULL,
	"locationLabel" varchar(160),
	"imageKey" varchar(255),
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"threadId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"authorId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"unionId" varchar(255) NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"passwordHash" text,
	"avatar" text,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"membershipStatus" varchar(20) DEFAULT 'free' NOT NULL,
	"membershipPlan" varchar(80),
	"membershipRenewalAt" timestamp,
	"exchangeRole" varchar(20),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignInAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_unionId_unique" UNIQUE("unionId")
);
--> statement-breakpoint
ALTER TABLE "license_requests" ADD CONSTRAINT "license_requests_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_replies" ADD CONSTRAINT "thread_replies_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_replies" ADD CONSTRAINT "thread_replies_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_likes_unique" ON "post_likes" USING btree ("postId","userId");