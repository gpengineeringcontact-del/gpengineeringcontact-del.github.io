import { serve } from "@hono/node-server";
import { serveStaticFiles } from "./lib/vite.js";
import app from "./app.js";
import { env } from "./lib/env.js";

if (env.isProduction) {
  serveStaticFiles(app);
  const port = parseInt(process.env.PORT || "3000", 10);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

export default app;
