import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { students, admins } from "./schema.js";
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
    console.log("Seeding database...");

    await db.insert(students).values({
        name: "John Doe",
        gender: "male",
        memorize: 5,
        parent: "Doe Family"
    })
    
    const hashed = await bcrypt.hash("admin123", 10);
    await db.insert(admins).values({
        username: "admin",
        password: hashed
    })

    console.log("Database seeded successfully!");
    process.exit(0);
}

seed();