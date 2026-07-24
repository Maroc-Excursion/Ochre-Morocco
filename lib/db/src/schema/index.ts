import { pgTable, serial, text, boolean, timestamp, integer, numeric } from "drizzle-orm/pg-core";

    export const adminUsers = pgTable("admin_users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    });

    export const adminSessions = pgTable("admin_sessions", {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    });

    export const services = pgTable("services", {
    id: serial("id").primaryKey(),
    sourceKey: text("source_key").notNull().unique(),
    category: text("category").notNull().default("excursion"),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("EUR"),
    duration: text("duration"),
    imageData: text("image_data"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    });

    export type AdminUser = typeof adminUsers.$inferSelect;
    export type Service = typeof services.$inferSelect;
    