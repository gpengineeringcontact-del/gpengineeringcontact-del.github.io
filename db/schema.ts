import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  username: varchar("username", { length: 30 }).unique(),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  avatar: text("avatar"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  membershipStatus: varchar("membershipStatus", { length: 20 }).default("free").notNull(),
  membershipPlan: varchar("membershipPlan", { length: 80 }),
  membershipRenewalAt: timestamp("membershipRenewalAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  purchaseConfirmationSentAt: timestamp("purchaseConfirmationSentAt"),
  isActive: boolean("isActive").default(true).notNull(),
  exchangeRole: varchar("exchangeRole", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Forum: Feed-Posts (Journey Globe)
// ---------------------------------------------------------------------------

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("authorId")
    .notNull()
    .references(() => users.id),
  caption: text("caption").notNull(),
  country: varchar("country", { length: 120 }).notNull(),
  locationLabel: varchar("locationLabel", { length: 160 }),
  imageKey: varchar("imageKey", { length: 255 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const postLikes = pgTable(
  "post_likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("postId")
      .notNull()
      .references(() => posts.id),
    userId: integer("userId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("post_likes_unique").on(t.postId, t.userId)],
);

export type PostLike = typeof postLikes.$inferSelect;

// ---------------------------------------------------------------------------
// Forum: Q&A Threads
// ---------------------------------------------------------------------------

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  authorId: integer("authorId")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Thread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;

export const threadReplies = pgTable("thread_replies", {
  id: serial("id").primaryKey(),
  threadId: integer("threadId")
    .notNull()
    .references(() => threads.id),
  authorId: integer("authorId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ThreadReply = typeof threadReplies.$inferSelect;

// ---------------------------------------------------------------------------
// B2B: Lizenzanfragen für Bildrechte
// ---------------------------------------------------------------------------

export const licenseRequests = pgTable("license_requests", {
  id: serial("id").primaryKey(),
  postId: integer("postId")
    .notNull()
    .references(() => posts.id),
  company: varchar("company", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("offen").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicenseRequest = typeof licenseRequests.$inferSelect;

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").references(() => users.id),
  recipientId: integer("recipientId").notNull().references(() => users.id),
  contactMessageId: integer("contactMessageId").references(() => contactMessages.id),
  subject: varchar("subject", { length: 160 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const typingStatuses = pgTable("typing_statuses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  recipientId: integer("recipientId").notNull().references(() => users.id),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => [uniqueIndex("typing_statuses_pair").on(table.userId, table.recipientId)]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporterId").notNull().references(() => users.id),
  postId: integer("postId").references(() => posts.id),
  threadId: integer("threadId").references(() => threads.id),
  reason: varchar("reason", { length: 80 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});
