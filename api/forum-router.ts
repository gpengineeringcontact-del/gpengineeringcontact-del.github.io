import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, memberQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { posts, postLikes, threads, threadReplies, licenseRequests, users } from "../db/schema.js";

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
        imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
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
        authorName: thread.author?.name ?? "Community",
        replies: thread.replies.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
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
