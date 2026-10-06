import { authRouter } from "./auth-router";
import { forumRouter } from "./forum-router";
import { createRouter, publicQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { contactMessages } from "@db/schema";

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
