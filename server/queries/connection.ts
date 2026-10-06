import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";
import { sql } from "drizzle-orm";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    instance = drizzle(postgres(env.databaseUrl), { schema: fullSchema });
  }

  return instance;
}

let compatibilityPromise: Promise<void> | undefined;

export async function ensureRuntimeSchema() {
  if (!compatibilityPromise) {
    const db = getDb();
    compatibilityPromise = (async () => {
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(30)`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" ("username")`);
      await db.execute(sql`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reportedUserId" integer REFERENCES "users"("id")`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS "user_blocks" ("id" serial PRIMARY KEY, "blockerId" integer NOT NULL REFERENCES "users"("id"), "blockedId" integer NOT NULL REFERENCES "users"("id"), "createdAt" timestamp DEFAULT now() NOT NULL)`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "user_blocks_pair" ON "user_blocks" ("blockerId", "blockedId")`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS "typing_statuses" ("id" serial PRIMARY KEY, "userId" integer NOT NULL REFERENCES "users"("id"), "recipientId" integer NOT NULL REFERENCES "users"("id"), "expiresAt" timestamp NOT NULL)`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "typing_statuses_pair" ON "typing_statuses" ("userId", "recipientId")`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS "travel_reports" ("id" serial PRIMARY KEY, "authorId" integer NOT NULL REFERENCES "users"("id"), "title" varchar(255) NOT NULL, "body" text NOT NULL, "country" varchar(120) NOT NULL, "locationLabel" varchar(160), "imageUrl" text, "createdAt" timestamp DEFAULT now() NOT NULL)`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS "content_comments" ("id" serial PRIMARY KEY, "authorId" integer NOT NULL REFERENCES "users"("id"), "postId" integer REFERENCES "posts"("id"), "reportId" integer REFERENCES "travel_reports"("id"), "body" text NOT NULL, "createdAt" timestamp DEFAULT now() NOT NULL)`);
    })().catch((error) => {
      compatibilityPromise = undefined;
      throw error;
    });
  }
  return compatibilityPromise;
}
