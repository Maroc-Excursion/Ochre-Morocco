import { createHash, randomBytes, pbkdf2 } from "node:crypto";
    import type { Request, Response, NextFunction } from "express";
    import { pool } from "@workspace/db";

    type AdminRequest = Request & { adminUser?: { id: number; email: string } };
    const COOKIE = "ochre_admin_session";
    const sessionHash = (value: string) => createHash("sha256").update(value).digest("hex");
    const setCookie = (res: Response, value: string, maxAge: number) => { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; res.setHeader("Set-Cookie", COOKIE + "=" + value + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + maxAge + secure); };
    const digest = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => pbkdf2(password, salt, 120000, 64, "sha512", (error, derived) => error ? reject(error) : resolve(derived)));
    export async function hashPassword(password: string) { const salt = randomBytes(16); const derived = await digest(password, salt); return "pbkdf2$120000$" + salt.toString("base64url") + "$" + derived.toString("base64url"); }
    export async function verifyPassword(password: string, encoded: string) { const parts = encoded.split("$"); if (parts.length !== 4 || parts[0] !== "pbkdf2" || parts[1] !== "120000") return false; const actual = await digest(password, Buffer.from(parts[2], "base64url")); return actual.toString("base64url") === parts[3]; }
    const readCookie = (req: Request) => req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
    export async function createSession(userId: number, res: Response) { const raw = randomBytes(32).toString("base64url"); await pool.query("INSERT INTO admin_sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '14 days')", [sessionHash(raw), userId]); setCookie(res, raw, 1209600); }
    export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) { try { const raw = readCookie(req); if (!raw) return res.status(401).json({ error: "AUTH_REQUIRED" }); const result = await pool.query("SELECT u.id, u.email FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.id = $1 AND s.expires_at > NOW()", [sessionHash(raw)]); if (!result.rows[0]) return res.status(401).json({ error: "SESSION_EXPIRED" }); req.adminUser = result.rows[0]; return next(); } catch (error) { const log = (req as any).log; log?.error({ error }, "authentication check failed"); return res.status(500).json({ error: "AUTH_CHECK_FAILED" }); } }
    export async function destroySession(req: Request, res: Response) { const raw = readCookie(req); if (raw) await pool.query("DELETE FROM admin_sessions WHERE id = $1", [sessionHash(raw)]); setCookie(res, "", 0); }
    export type { AdminRequest };
    