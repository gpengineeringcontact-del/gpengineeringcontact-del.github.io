import { authRouter } from "./auth-router.js";
import { forumRouter } from "./forum-router.js";
import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { getDb } from "./queries/connection.js";
import { contactMessages, directMessages } from "../db/schema.js";
import { authedQuery, adminQuery } from "./middleware.js";
import { and, desc, eq } from "drizzle-orm";

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
    markRead: authedQuery.input(z.object({ messageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await getDb().update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.id, input.messageId), eq(directMessages.recipientId, ctx.user.id)));
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
