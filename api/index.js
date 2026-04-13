import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { z } from "zod";
import { db } from "../db/index.js";
import 'dotenv/config';
import bcrypt from "bcryptjs";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { admins, students } from "../db/schema.js";
import { eq } from "drizzle-orm";

const app = new Hono();
const SECRET = process.env.JWT_SECRET;


app.get("/api/hello", (c) => {
    return c.json({ message: "PSB Student Management System" });
})

app.post("/api/submit", async (c) => {
    const body = await c.req.parseBody();

    const schema = z.object({
        name: z.string().min(3, "name minimal 3 charater"),
        gender: z.enum(["male", "female"]),
        memorize: z.coerce.number(),
        parent: z.string().min(3),
        'g-recaptcha-response': z.string().min(1, "Please complete the reCAPTCHA")
    });

    const parse = schema.safeParse(body);
    if (!parse.success) {
        return c.json({ error: parse.error.errors.map(e => e.message).join(", ") }, 400);
    }

    if (parse.gender == "female") {
        return c.json({ error: "Gender not avilable"}, 400);
    }

    const fromData = new URLSearchParams();
    fromData.append('secret', process.env.RECAPTCHA_SECRET);
    fromData.append('response', parse.data['g-recaptcha-response']);

    const vertify = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        body: fromData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const captchaRes = await vertify.json();
    if (!captchaRes.success) {
        return c.json({ error: "reCAPTCHA verification failed" }, 400);
    }

    await db.insert(students).values({
        name: parse.data.name,
        gender: parse.data.gender,
        memorize: parse.data.memorize,
        parent: parse.data.parent
    })

    return c.json({ message: "Student data submitted successfully" });
})

app.post("/api/login", async (c) => {
    const { username, password } = await c.req.parseBody();
    const [user] = await db.select().from(admins).where(eq(admins.username, username));

    if (user && await bcrypt.compare(password, user.password)) {
        const token = await sign({ 
            user: user.username, 
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, 
            SECRET);

        setCookie(c, "token", token, { httpOnly: true, secure: false, sameSite: 'Lax' });
        return c.json({ message: "Login successful" });
    }
    return c.json({ error: "Invalid credentials" }, 401);
});

app.get("/api/admin/students", async (c) => {
    const token = getCookie(c, 'token');
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    try {
        await verify(token, SECRET, "HS256");
        const data = await db.select().from(students);
        return c.json( data );
    } catch (err) {
        return c.json({ error: `Invalid token: ${err}`}, 401);
    }
});

app.get("/api/logout", (c) => {
    deleteCookie(c, "token");
    return c.json({ message: "Logged out successfully" });
});

app.use("/*", serveStatic({ root: "./public" }));
serve({ fetch: app.fetch, port: 8000 });
export default app;