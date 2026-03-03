import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "hono/serve-static";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/api/hello", (c) => {
    return c.json({ message: "PSB Student Management System" });
})

serve({ fetch: app.fetch, port: 8000 });
export default app.fetch;