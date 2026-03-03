import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "hono/serve-static";
import { z } from "zod";
import { db } from "../db/index.js";
import 'dotenv/config'; 

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/api/hello", (c) => {
    return c.json({ message: "PSB Student Management System" });
})

app.post("/api/submit", async (c) => {
    const body = await c.req.parseBody();

    const schema = z.object({
        name: z.string().min(3),
        gender: z.enum(["male", "female"]),
        memorize: z.coerce.number(),
        parent: z.string().min(3),
        'g-recaptcha-response': z.string().min(1, "Please complete the reCAPTCHA")
    });

    const parse = schema.safeParse(body);
    if (!parse.success) {
        return c.json({ error: parse.error.errors.map(e => e.message).join(", ") }, 400);
    }

    const vertify = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${body['g-recaptcha-response']}`,)
    const captchaRes = await vertify.json();
    if (!captchaRes.success) {
        return c.json({ error: "reCAPTCHA verification failed" }, 400);
    }

    await db.insert(db.students).values({
        name: parse.data.name,
        gender: parse.data.gender,
        memorize: parse.data.memorize,
        parent: parse.data.parent
    })

    return c.json({ message: "Student data submitted successfully" });
})

serve({ fetch: app.fetch, port: 8000 });
export default app.fetch;