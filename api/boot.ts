import { serve } from "@hono/node-server";
import { serveStaticFiles } from "./lib/vite";
import app from "./app";
import { env } from "./lib/env";

if (env.isProduction) {
  serveStaticFiles(app);
  const port = parseInt(process.env.PORT || "3000", 10);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

export default app;
