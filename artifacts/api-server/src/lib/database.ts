import { promises as fs } from "node:fs";
    import path from "node:path";
    import { pool } from "@workspace/db";
    import { hashPassword } from "./auth";

    export async function initializeDatabase() {
    await pool.query("CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); CREATE TABLE IF NOT EXISTS services (id SERIAL PRIMARY KEY, source_key TEXT NOT NULL UNIQUE, category TEXT NOT NULL DEFAULT 'excursion', title TEXT NOT NULL, title_ar TEXT, description TEXT, price NUMERIC(10,2) NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'EUR', duration TEXT, image_data TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INTEGER NOT NULL DEFAULT 0, metadata TEXT NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) { const existing = await pool.query("SELECT id FROM admin_users LIMIT 1"); if (!existing.rows[0]) await pool.query("INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)", [email, await hashPassword(password)]); }
    await importSeed("data/excursions.json", "excursion");
    await importSeed("data/circuits.json", "circuit");
    }
    async function importSeed(file: string, category: string) { try { const content = await fs.readFile(path.resolve(process.cwd(), file), "utf8"); const items = JSON.parse(content); if (!Array.isArray(items)) return; for (let i = 0; i < items.length; i++) { const item = items[i]; if (!item?.title) continue; const sourceKey = category + ":" + String(item.id || i); await pool.query("INSERT INTO services (source_key, category, title, title_ar, description, price, currency, duration, active, sort_order, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (source_key) DO NOTHING", [sourceKey, category, item.title, item.titleAr || null, item.description || null, Number(item.price || 0), item.currency || "EUR", item.duration || null, item.active !== false, i, JSON.stringify(item)]); } } catch { /* seed files are optional in external deployments */ } }
    