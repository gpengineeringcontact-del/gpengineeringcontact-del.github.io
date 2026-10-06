import { relations } from "drizzle-orm";
import { users, posts, postLikes, threads, threadReplies, licenseRequests, travelReports, passwordResetTokens, reports, contactMessages, directMessages, typingStatuses, userBlocks } from "./schema.js";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  travelReports: many(travelReports),
  likes: many(postLikes),
  threads: many(threads),
  replies: many(threadReplies),
  passwordResetTokens: many(passwordResetTokens),
  reports: many(reports),
  contactMessages: many(contactMessages),
  sentMessages: many(directMessages, { relationName: "sentMessages" }),
  receivedMessages: many(directMessages, { relationName: "receivedMessages" }),
  typingStatuses: many(typingStatuses),
  blocksGiven: many(userBlocks, { relationName: "blocksGiven" }),
  blocksReceived: many(userBlocks, { relationName: "blocksReceived" }),
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

export const travelReportsRelations = relations(travelReports, ({ one }) => ({
  author: one(users, { fields: [travelReports.authorId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
  post: one(posts, { fields: [reports.postId], references: [posts.id] }),
  thread: one(threads, { fields: [reports.threadId], references: [threads.id] }),
  reportedUser: one(users, { fields: [reports.reportedUserId], references: [users.id] }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one, many }) => ({
  user: one(users, { fields: [contactMessages.userId], references: [users.id] }),
  replies: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, { fields: [directMessages.senderId], references: [users.id], relationName: "sentMessages" }),
  recipient: one(users, { fields: [directMessages.recipientId], references: [users.id], relationName: "receivedMessages" }),
  contactMessage: one(contactMessages, { fields: [directMessages.contactMessageId], references: [contactMessages.id] }),
}));

export const typingStatusesRelations = relations(typingStatuses, ({ one }) => ({
  user: one(users, { fields: [typingStatuses.userId], references: [users.id] }),
  recipient: one(users, { fields: [typingStatuses.recipientId], references: [users.id] }),
}));

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, { fields: [userBlocks.blockerId], references: [users.id], relationName: "blocksGiven" }),
  blocked: one(users, { fields: [userBlocks.blockedId], references: [users.id], relationName: "blocksReceived" }),
}));
