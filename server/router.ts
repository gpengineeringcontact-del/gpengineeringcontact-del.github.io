import { authRouter } from "./auth-router.js";
import { forumRouter } from "./forum-router.js";
import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { getDb } from "./queries/connection.js";
import { contactMessages } from "../db/schema.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  forum: forumRouter,
  contact: createRouter({
    send: publicQuery.input(z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().max(320),
      message: z.string().min(10).max(5000),
    })).mutation(async ({ input }) => {
      await getDb().insert(contactMessages).values(input);
      return { ok: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
