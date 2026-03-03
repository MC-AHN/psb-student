import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    gender: varchar("gender", { length: 10 }).notNull(),
    memorize: integer("memorize").default(0),
    parent: varchar("parent", { length: 255 }).notNull()
});

export const admins = pgTable("admins", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull()
});