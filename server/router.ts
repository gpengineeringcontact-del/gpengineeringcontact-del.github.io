import { authRouter } from "./auth-router.js";
import { forumRouter } from "./forum-router.js";
import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { getDb } from "./queries/connection.js";
import { contactMessages, directMessages, typingStatuses, users } from "../db/schema.js";
import { authedQuery, adminQuery } from "./middleware.js";
import { and, desc, eq, gt, ilike, isNull, ne, or } from "drizzle-orm";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  forum: forumRouter,
  contact: createRouter({
    send: authedQuery.input(z.object({
      message: z.string().min(10).max(5000),
    })).mutation(async ({ input, ctx }) => {
      await getDb().insert(contactMessages).values({
        userId: ctx.user.id,
        name: ctx.user.name ?? "Wyfare-Mitglied",
        email: ctx.user.email,
        message: input.message,
      });
      return { ok: true };
    }),
    listMine: authedQuery.query(async ({ ctx }) => {
      const db = getDb();
      return db.query.directMessages.findMany({
        where: eq(directMessages.recipientId, ctx.user.id),
        orderBy: [desc(directMessages.createdAt)],
        with: { sender: true },
        limit: 100,
      });
    }),
    unreadCount: authedQuery.query(async ({ ctx }) => {
      const rows = await getDb().query.directMessages.findMany({
        where: and(eq(directMessages.recipientId, ctx.user.id), isNull(directMessages.readAt)),
        columns: { id: true },
      });
      return { count: rows.length };
    }),
    searchUsers: authedQuery.input(z.object({ query: z.string().min(1).max(60) })).query(async ({ ctx, input }) => {
      const query = `%${input.query.trim().toLowerCase()}%`;
      return getDb().query.users.findMany({
        where: and(eq(users.isActive, true), or(ilike(users.username, query), ilike(users.name, query)), ne(users.id, ctx.user.id)),
        columns: { id: true, username: true, name: true, avatar: true },
        limit: 20,
      });
    }),
    conversation: authedQuery.input(z.object({ userId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      return getDb().query.directMessages.findMany({
        where: or(and(eq(directMessages.senderId, ctx.user.id), eq(directMessages.recipientId, input.userId)), and(eq(directMessages.senderId, input.userId), eq(directMessages.recipientId, ctx.user.id))),
        orderBy: [directMessages.createdAt],
        with: { sender: true },
        limit: 200,
      });
    }),
    sendDirect: authedQuery.input(z.object({ recipientId: z.number().int().positive(), body: z.string().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.recipientId) throw new Error("Du kannst dir nicht selbst schreiben.");
      const db = getDb();
      const recipient = await db.query.users.findFirst({ where: and(eq(users.id, input.recipientId), eq(users.isActive, true)) });
      if (!recipient) throw new Error("Dieser Nutzer ist nicht verfügbar.");
      await db.insert(directMessages).values({ senderId: ctx.user.id, recipientId: recipient.id, subject: "Nachricht", body: input.body });
      await db.delete(typingStatuses).where(and(eq(typingStatuses.userId, ctx.user.id), eq(typingStatuses.recipientId, recipient.id)));
      return { ok: true };
    }),
    setTyping: authedQuery.input(z.object({ recipientId: z.number().int().positive(), typing: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (input.typing) {
        await db.insert(typingStatuses).values({ userId: ctx.user.id, recipientId: input.recipientId, expiresAt: new Date(Date.now() + 5000) }).onConflictDoUpdate({
          target: [typingStatuses.userId, typingStatuses.recipientId],
          set: { expiresAt: new Date(Date.now() + 5000) },
        });
      } else await db.delete(typingStatuses).where(and(eq(typingStatuses.userId, ctx.user.id), eq(typingStatuses.recipientId, input.recipientId)));
      return { ok: true };
    }),
    isTyping: authedQuery.input(z.object({ userId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const status = await getDb().query.typingStatuses.findFirst({ where: and(eq(typingStatuses.userId, input.userId), eq(typingStatuses.recipientId, ctx.user.id), gt(typingStatuses.expiresAt, new Date())) });
      return { typing: !!status };
    }),
    markRead: authedQuery.input(z.object({ messageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await getDb().update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.id, input.messageId), eq(directMessages.recipientId, ctx.user.id)));
      return { ok: true };
    }),
    markConversationRead: authedQuery.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await getDb().update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.senderId, input.userId), eq(directMessages.recipientId, ctx.user.id), isNull(directMessages.readAt)));
      return { ok: true };
    }),
    adminReply: adminQuery.input(z.object({
      contactId: z.number().int().positive(),
      subject: z.string().min(3).max(160),
      message: z.string().min(2).max(5000),
    })).mutation(async ({ input, ctx }) => {
      const db = getDb();
      const contact = await db.query.contactMessages.findFirst({ where: eq(contactMessages.id, input.contactId) });
      if (!contact?.userId) throw new Error("Diese Anfrage gehört keinem Konto.");
      await db.insert(directMessages).values({
        senderId: ctx.user.id,
        recipientId: contact.userId,
        contactMessageId: contact.id,
        subject: input.subject,
        body: input.message,
      });
      await db.update(contactMessages).set({ status: "answered" }).where(eq(contactMessages.id, contact.id));
      return { ok: true };
    }),
    delete: adminQuery.input(z.object({ contactId: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(directMessages).where(eq(directMessages.contactMessageId, input.contactId));
      await db.delete(contactMessages).where(eq(contactMessages.id, input.contactId));
      return { ok: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
