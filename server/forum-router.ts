import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, memberQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { contactMessages, posts, postLikes, threads, threadReplies, licenseRequests, reports, travelReports, contentComments, users } from "../db/schema.js";
import { sendAdminMessageEmail } from "./lib/email.js";
import { uploadPostImage } from "./lib/storage.js";

const COUNTRIES = [
  "USA",
  "Kanada",
  "Neuseeland",
  "Großbritannien",
  "Irland",
  "Australien",
  "Japan",
  "Spanien",
  "Frankreich",
  "Anderes Land",
] as const;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const forumRouter = createRouter({
  // ------------------------------------------------------------- Feed-Posts
  listPosts: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.query.posts.findMany({
      orderBy: [desc(posts.createdAt)],
      with: { author: true, likes: true },
      limit: 60,
    });
    return rows.map((p) => ({
      id: p.id,
      caption: p.caption,
      country: p.country,
      locationLabel: p.locationLabel,
      createdAt: p.createdAt,
      authorName: p.author?.name ?? "Community",
      authorRole: p.author?.exchangeRole ?? null,
      likeCount: p.likes.length,
      likedByMe: ctx.user ? p.likes.some((l) => l.userId === ctx.user!.id) : false,
      imageSrc: p.imageUrl ?? null,
      authorId: p.authorId,
    }));
  }),

  createPost: memberQuery
    .input(
      z.object({
        caption: z.string().min(3).max(1000),
        country: z.enum(COUNTRIES),
        locationLabel: z.string().max(160).optional(),
        imageBase64: z.string().optional(),
        imageName: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        const buffer = Buffer.from(input.imageBase64, "base64");
        if (buffer.byteLength > MAX_IMAGE_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bild ist größer als 4 MB.",
          });
        }
        const extension = (input.imageName ?? "post.jpg").split(".").pop()?.toLowerCase();
        const mime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
        imageUrl = await uploadPostImage(buffer, extension ?? "jpg", mime);
      }
      const db = getDb();
      await db.insert(posts).values({
        authorId: ctx.user.id,
        caption: input.caption,
        country: input.country,
        locationLabel: input.locationLabel ?? null,
        imageKey: null,
        imageUrl: imageUrl ?? null,
      });
      return { ok: true };
    }),
  updatePost: memberQuery.input(z.object({ postId: z.number().int().positive(), caption: z.string().min(3).max(1000), country: z.enum(COUNTRIES), locationLabel: z.string().max(160).optional() })).mutation(async ({ ctx, input }) => {
    const result = await getDb().update(posts).set({ caption: input.caption, country: input.country, locationLabel: input.locationLabel ?? null }).where(and(eq(posts.id, input.postId), eq(posts.authorId, ctx.user.id))).returning({ id: posts.id });
    if (!result.length) throw new TRPCError({ code: "FORBIDDEN", message: "Du kannst nur eigene Beiträge bearbeiten." });
    return { ok: true };
  }),
  deleteOwnPost: memberQuery.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await getDb().delete(posts).where(and(eq(posts.id, input.postId), eq(posts.authorId, ctx.user.id)));
    return { ok: true };
  }),
  listComments: publicQuery.input(z.object({ postId: z.number().int().positive().optional(), reportId: z.number().int().positive().optional() }).refine((input) => Boolean(input.postId) !== Boolean(input.reportId), "Genau ein Inhalt muss ausgewählt werden.")).query(async ({ input }) => {
    const where = input.postId ? eq(contentComments.postId, input.postId) : eq(contentComments.reportId, input.reportId!);
    const rows = await getDb().query.contentComments.findMany({ where, orderBy: [desc(contentComments.createdAt)], with: { author: true } });
    return rows.map((row) => ({ ...row, authorName: row.author?.name ?? "Community" }));
  }),
  addComment: memberQuery.input(z.object({ postId: z.number().int().positive().optional(), reportId: z.number().int().positive().optional(), body: z.string().min(2).max(2000) }).refine((input) => Boolean(input.postId) !== Boolean(input.reportId), "Genau ein Inhalt muss ausgewählt werden.")).mutation(async ({ ctx, input }) => {
    if (!input.postId && !input.reportId) throw new TRPCError({ code: "BAD_REQUEST", message: "Kein Inhalt ausgewählt." });
    await getDb().insert(contentComments).values({ authorId: ctx.user.id, postId: input.postId ?? null, reportId: input.reportId ?? null, body: input.body.trim() });
    return { ok: true };
  }),

  toggleLike: memberQuery
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db.query.postLikes.findFirst({
        where: and(
          eq(postLikes.postId, input.postId),
          eq(postLikes.userId, ctx.user.id),
        ),
      });
      if (existing) {
        await db.delete(postLikes).where(eq(postLikes.id, existing.id));
        return { liked: false };
      }
      await db.insert(postLikes).values({ postId: input.postId, userId: ctx.user.id });
      return { liked: true };
    }),

  // ------------------------------------------------------------- Q&A Threads
  listThreads: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.query.threads.findMany({
      orderBy: [desc(threads.createdAt)],
      with: { author: true, replies: true },
      limit: 50,
    });
    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      createdAt: t.createdAt,
      authorId: t.authorId,
      authorName: t.author?.name ?? "Community",
      replyCount: t.replies.length,
    }));
  }),

  getThread: publicQuery
    .input(z.object({ threadId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, input.threadId),
        with: {
          author: true,
          replies: { orderBy: [threadReplies.createdAt], with: { author: true } },
        },
      });
      if (!thread) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread nicht gefunden." });
      }
      return {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        createdAt: thread.createdAt,
        authorId: thread.authorId,
        authorName: thread.author?.name ?? "Community",
        replies: thread.replies.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          authorId: r.authorId,
          authorName: r.author?.name ?? "Community",
        })),
      };
    }),

  createThread: memberQuery
    .input(
      z.object({
        title: z.string().min(5).max(255),
        body: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(threads).values({
        authorId: ctx.user.id,
        title: input.title,
        body: input.body ?? null,
      });
      return { ok: true };
    }),

  replyToThread: memberQuery
    .input(
      z.object({
        threadId: z.number().int().positive(),
        content: z.string().min(2).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(threadReplies).values({
        threadId: input.threadId,
        authorId: ctx.user.id,
        content: input.content,
      });
      return { ok: true };
    }),

  listTravelReports: publicQuery.query(async () => {
    const rows = await getDb().query.travelReports.findMany({
      orderBy: [desc(travelReports.createdAt)],
      with: { author: true },
      limit: 60,
    });
    return rows.map((report) => ({
      ...report,
      authorId: report.authorId,
      authorName: report.author?.name ?? "Community",
    }));
  }),

  createTravelReport: memberQuery
    .input(z.object({
      title: z.string().min(5).max(255),
      body: z.string().min(50).max(12000),
      country: z.enum(COUNTRIES),
      locationLabel: z.string().max(160).optional(),
      imageBase64: z.string().optional(),
      imageName: z.string().max(120).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        const buffer = Buffer.from(input.imageBase64, "base64");
        if (buffer.byteLength > MAX_IMAGE_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Bild ist größer als 4 MB." });
        const extension = (input.imageName ?? "report.jpg").split(".").pop()?.toLowerCase() ?? "jpg";
        const mime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
        imageUrl = await uploadPostImage(buffer, extension, mime);
      }
      await getDb().insert(travelReports).values({
        authorId: ctx.user.id,
        title: input.title.trim(),
        body: input.body.trim(),
        country: input.country,
        locationLabel: input.locationLabel?.trim() || null,
        imageUrl: imageUrl ?? null,
      });
      return { ok: true };
    }),
  updateTravelReport: memberQuery.input(z.object({ reportId: z.number().int().positive(), title: z.string().min(5).max(255), body: z.string().min(50).max(12000), country: z.enum(COUNTRIES), locationLabel: z.string().max(160).optional() })).mutation(async ({ ctx, input }) => {
    const result = await getDb().update(travelReports).set({ title: input.title.trim(), body: input.body.trim(), country: input.country, locationLabel: input.locationLabel?.trim() || null }).where(and(eq(travelReports.id, input.reportId), eq(travelReports.authorId, ctx.user.id))).returning({ id: travelReports.id });
    if (!result.length) throw new TRPCError({ code: "FORBIDDEN", message: "Du kannst nur eigene Berichte bearbeiten." });
    return { ok: true };
  }),
  deleteOwnTravelReport: memberQuery.input(z.object({ reportId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await getDb().delete(travelReports).where(and(eq(travelReports.id, input.reportId), eq(travelReports.authorId, ctx.user.id)));
    return { ok: true };
  }),

  // ------------------------------------------------------------- B2B Lizenzen
  requestLicense: publicQuery
    .input(
      z.object({
        postId: z.number().int().positive(),
        company: z.string().min(2).max(255),
        email: z.string().email().max(320),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(licenseRequests).values({
        postId: input.postId,
        company: input.company,
        email: input.email,
        message: input.message ?? null,
      });
      return { ok: true };
    }),

  reportPost: authedQuery
    .input(z.object({
      postId: z.number().int().positive(),
      reason: z.enum(["spam", "harassment", "copyright", "unsafe", "other"]),
      details: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(reports).values({ reporterId: ctx.user.id, postId: input.postId, reason: input.reason, details: input.details ?? null });
      return { ok: true };
    }),

  reportThread: authedQuery
    .input(z.object({
      threadId: z.number().int().positive(),
      reason: z.enum(["spam", "harassment", "unsafe", "other"]),
      details: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(reports).values({ reporterId: ctx.user.id, threadId: input.threadId, reason: input.reason, details: input.details ?? null });
      return { ok: true };
    }),

  listReports: adminQuery.query(async () => getDb().query.reports.findMany({
    where: eq(reports.status, "open"),
    with: { reporter: true, post: true, thread: true },
    orderBy: [desc(reports.createdAt)],
    limit: 100,
  })),

  resolveReport: adminQuery
    .input(z.object({ reportId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await getDb().update(reports).set({ status: "resolved", resolvedAt: new Date() }).where(eq(reports.id, input.reportId));
      return { ok: true };
    }),

  deactivateUser: adminQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await getDb().update(users).set({ isActive: false }).where(eq(users.id, input.userId));
      return { ok: true };
    }),

  listUsers: adminQuery.query(async () => {
    const rows = await getDb().query.users.findMany({ orderBy: [desc(users.createdAt)], limit: 500 });
    return rows.map(({ passwordHash: _passwordHash, ...user }) => user);
  }),

  updateUser: adminQuery
    .input(z.object({
      userId: z.number().int().positive(),
      name: z.string().min(2).max(255),
      username: z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/),
      role: z.enum(["user", "admin"]),
      membershipStatus: z.enum(["free", "active"]),
      isActive: z.boolean(),
      exchangeRole: z.enum(["planung", "im_ausland", "alumni"]).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && (input.role !== "admin" || !input.isActive)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Du kannst deinen eigenen Admin-Zugang nicht entfernen." });
      }
      const duplicate = await getDb().query.users.findFirst({
        where: and(eq(users.username, input.username.toLowerCase()), ne(users.id, input.userId)),
      });
      if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "Dieser Benutzername ist bereits vergeben." });
      await getDb().update(users).set({
        name: input.name.trim(),
        username: input.username.toLowerCase(),
        role: input.role,
        membershipStatus: input.membershipStatus,
        membershipPlan: input.membershipStatus === "active" ? "premium" : "free",
        isActive: input.isActive,
        exchangeRole: input.exchangeRole,
      }).where(eq(users.id, input.userId));
      return { ok: true };
    }),

  deleteUser: adminQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Du kannst dein eigenes Admin-Konto hier nicht löschen." });
      }
      await getDb().update(users).set({ isActive: false }).where(eq(users.id, input.userId));
      return { ok: true };
    }),

  deletePost: adminQuery
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(postLikes).where(eq(postLikes.postId, input.postId));
      await db.delete(reports).where(eq(reports.postId, input.postId));
      await db.delete(licenseRequests).where(eq(licenseRequests.postId, input.postId));
      await db.delete(posts).where(eq(posts.id, input.postId));
      return { ok: true };
    }),

  deleteThread: adminQuery
    .input(z.object({ threadId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const replyRows = await db.query.threadReplies.findMany({ where: eq(threadReplies.threadId, input.threadId) });
      for (const reply of replyRows) {
        await db.delete(reports).where(eq(reports.threadId, input.threadId));
        await db.delete(threadReplies).where(eq(threadReplies.id, reply.id));
      }
      await db.delete(reports).where(eq(reports.threadId, input.threadId));
      await db.delete(threads).where(eq(threads.id, input.threadId));
      return { ok: true };
    }),

  deleteReply: adminQuery
    .input(z.object({ replyId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await getDb().delete(threadReplies).where(eq(threadReplies.id, input.replyId));
      return { ok: true };
    }),

  listAdminInbox: adminQuery.query(async () => {
    const db = getDb();
    const [contacts, licenses] = await Promise.all([
      db.query.contactMessages.findMany({ orderBy: [desc(contactMessages.createdAt)], limit: 100 }),
      db.query.licenseRequests.findMany({ orderBy: [desc(licenseRequests.createdAt)], with: { post: true }, limit: 100 }),
    ]);
    return { contacts, licenses };
  }),

  updateLicenseStatus: adminQuery
    .input(z.object({ requestId: z.number().int().positive(), status: z.enum(["zugestimmt", "abgelehnt"]) }))
    .mutation(async ({ input }) => {
      await getDb().update(licenseRequests).set({ status: input.status }).where(eq(licenseRequests.id, input.requestId));
      return { ok: true };
    }),

  messageUser: adminQuery
    .input(z.object({
      userId: z.number().int().positive(),
      subject: z.string().min(3).max(160),
      message: z.string().min(2).max(5000),
    }))
    .mutation(async ({ input }) => {
      const user = await getDb().query.users.findFirst({ where: eq(users.id, input.userId) });
      if (!user?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Dieser Nutzer hat keine E-Mail-Adresse." });
      await sendAdminMessageEmail(user.email, input.subject, input.message);
      return { ok: true };
    }),

  // ------------------------------------------------------------- Profil
  setExchangeRole: authedQuery
    .input(z.object({ exchangeRole: z.enum(["planung", "im_ausland", "alumni"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ exchangeRole: input.exchangeRole })
        .where(eq(users.id, ctx.user.id));
      return { ok: true };
    }),
});
