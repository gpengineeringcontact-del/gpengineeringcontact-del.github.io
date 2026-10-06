import { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { createCheckoutSession, handleStripeWebhook } from "./stripe.js";
import { getDb } from "./queries/connection.js";
import { sql } from "drizzle-orm";
import { databaseErrorMessage } from "./lib/database-errors.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  }),
);
app.post("/api/stripe/checkout", (c) => createCheckoutSession(c.req.raw));
app.post("/api/stripe/webhook", (c) => handleStripeWebhook(c.req.raw));
app.get("/api/health", async (c) => {
  try {
    await getDb().execute(sql`select 1`);
    return c.json({ ok: true, database: "reachable" });
  } catch (error) {
    return c.json({ ok: false, database: databaseErrorMessage(error) }, 503);
  }
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
