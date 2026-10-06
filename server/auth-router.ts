import * as cookie from "cookie";
import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { Session } from "../contracts/constants.js";
import { getSessionCookieOptions } from "./lib/cookies.js";
import { createRouter, authedQuery, publicQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { passwordResetTokens, posts, threads, users } from "../db/schema.js";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { signSessionToken } from "./session.js";
import { databaseErrorMessage } from "./lib/database-errors.js";
import { sendPasswordResetEmail, sendRegistrationEmail } from "./lib/email.js";

const scrypt = promisify(nodeScrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function setSession(ctx: { resHeaders: Headers }, email: string) {
  const token = await signSessionToken({ unionId: `email:${email}`, clientId: "wyfare" });
  const opts = getSessionCookieOptions(new Headers());
  ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, {
    httpOnly: true, path: opts.path, sameSite: "lax", secure: opts.secure,
    maxAge: Session.maxAgeMs / 1000,
  }));
}

export const authRouter = createRouter({
  requestPasswordReset: publicQuery.input(z.object({
    email: z.string().email().max(320),
  })).mutation(async ({ input }) => {
    const email = input.email.trim().toLowerCase();
    const user = await getDb().query.users.findFirst({ where: eq(users.email, email) });
    if (user?.email) {
      const token = randomBytes(32).toString("hex");
      await getDb().insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      await sendPasswordResetEmail(user.email, token);
    }
    return { success: true };
  }),
  resetPassword: publicQuery.input(z.object({
    token: z.string().min(32).max(128),
    password: z.string().min(8).max(128),
  })).mutation(async ({ input }) => {
    const tokenHash = hashResetToken(input.token);
    const db = getDb();
    const reset = await db.query.passwordResetTokens.findFirst({
      where: and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())),
    });
    if (!reset) throw new Error("Der Passwort-Link ist ungültig oder abgelaufen.");
    await db.update(users).set({ passwordHash: await hashPassword(input.password) }).where(eq(users.id, reset.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, reset.id));
    return { success: true };
  }),
  register: publicQuery.input(z.object({
    name: z.string().min(2).max(255),
    username: z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/),
    email: z.string().email().max(320),
    password: z.string().min(8).max(128),
    plan: z.enum(["free", "premium"]).default("free"),
  })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    let existing;
    try {
      existing = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
    } catch (error) {
      throw new Error(databaseErrorMessage(error));
    }
    if (existing) throw new Error("Für diese E-Mail-Adresse gibt es bereits ein Konto.");
    const normalizedEmail = input.email.toLowerCase();
    const username = input.username.toLowerCase();
    const existingUsername = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (existingUsername) throw new Error("Dieser Benutzername ist bereits vergeben.");
    await db.insert(users).values({
      unionId: `email:${normalizedEmail}`,
      name: input.name.trim(),
      username,
      email: normalizedEmail,
      passwordHash: await hashPassword(input.password),
      membershipPlan: input.plan,
      lastSignInAt: new Date(),
    });
    await sendRegistrationEmail(normalizedEmail, input.name.trim());
    await setSession(ctx, normalizedEmail);
    return { success: true };
  }),
  login: publicQuery.input(z.object({
    identifier: z.string().min(3).max(320),
    password: z.string().min(1).max(128),
  })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    const identifier = input.identifier.trim().toLowerCase();
    const user = identifier.includes("@")
      ? await db.query.users.findFirst({ where: eq(users.email, identifier) })
      : await db.query.users.findFirst({ where: eq(users.username, identifier) });
    if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new Error("Benutzername/E-Mail oder Passwort stimmt nicht.");
    }
    await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
    if (!user.email) throw new Error("Für dieses Konto ist keine E-Mail-Adresse hinterlegt.");
    await setSession(ctx, user.email);
    return { success: true };
  }),
  me: authedQuery.query((opts) => opts.ctx.user),
  updateProfile: authedQuery.input(z.object({
    name: z.string().min(2).max(255),
    username: z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/),
    exchangeRole: z.enum(["planung", "im_ausland", "alumni"]).nullable(),
  })).mutation(async ({ ctx, input }) => {
    const duplicate = await getDb().query.users.findFirst({ where: and(eq(users.username, input.username.toLowerCase()), ne(users.id, ctx.user.id)) });
    if (duplicate) throw new Error("Dieser Benutzername ist bereits vergeben.");
    await getDb().update(users).set({ name: input.name.trim(), username: input.username.toLowerCase(), exchangeRole: input.exchangeRole }).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
  changePassword: authedQuery.input(z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.passwordHash || !(await verifyPassword(input.currentPassword, ctx.user.passwordHash))) {
      throw new Error("Das aktuelle Passwort stimmt nicht.");
    }
    await getDb().update(users).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
  exportData: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [ownPosts, ownThreads] = await Promise.all([
      db.query.posts.findMany({ where: eq(posts.authorId, ctx.user.id) }),
      db.query.threads.findMany({ where: eq(threads.authorId, ctx.user.id) }),
    ]);
    return { user: { ...ctx.user, passwordHash: null }, posts: ownPosts, threads: ownThreads };
  }),
  deleteAccount: authedQuery.mutation(async ({ ctx }) => {
    await getDb().update(users).set({ isActive: false, email: null, name: "Gelöschtes Konto", passwordHash: null }).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
