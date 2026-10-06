import { relations } from "drizzle-orm";
import { users, posts, postLikes, threads, threadReplies, licenseRequests } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  likes: many(postLikes),
  threads: many(threads),
  replies: many(threadReplies),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  likes: many(postLikes),
  licenseRequests: many(licenseRequests),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, { fields: [threads.authorId], references: [users.id] }),
  replies: many(threadReplies),
}));

export const threadRepliesRelations = relations(threadReplies, ({ one }) => ({
  thread: one(threads, { fields: [threadReplies.threadId], references: [threads.id] }),
  author: one(users, { fields: [threadReplies.authorId], references: [users.id] }),
}));

export const licenseRequestsRelations = relations(licenseRequests, ({ one }) => ({
  post: one(posts, { fields: [licenseRequests.postId], references: [posts.id] }),
}));
