import { errors, jwtVerify, SignJWT } from "jose";
import type { Env } from "./env";
import { allowedOrigin,frontendOrigin } from "./origins";

const encoder = new TextEncoder();
const ITERATIONS = 100_000;
const HASH_PREFIX = `pbkdf2-sha256$${ITERATIONS}$`;
const SESSION_TTL = 60 * 60 * 24 * 7;
const ISSUER = "fitness-tracker";
const AUDIENCE = "fitness-tracker:web";

export interface PublicUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface LoginUser extends PublicUser {
  password_hash: string;
  salt: string;
}

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export function getDb(env: Env) {
  const { DB } = env;
  if (!DB || typeof DB.prepare !== "function") {
    throw new Error("Missing D1 binding: DB");
  }
  return DB;
}

function signingKey(env: Env) {
  const secret = env.JWT_SECRET;
  if (typeof secret !== "string" || encoder.encode(secret).length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 random bytes");
  }
  return encoder.encode(secret);
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "Cloudflare-CDN-Cache-Control": "no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function authError(error: unknown) {
  const known = error instanceof AuthError;
  if (!known) console.error("Authentication request failed");
  const response = json(
    { error: known ? error.message : "服務暫時無法使用，請稍後再試。" },
    known ? error.status : 500,
  );
  if (known && error.retryAfter) {
    response.headers.set("Retry-After", String(error.retryAfter));
  }
  return response;
}

export function assertSameOrigin(request: Request,env?:Env) {
  cookieSettings(request);
  if (!allowedOrigin(request,env)) {
    throw new AuthError(403, "不允許跨來源操作。");
  }
}

export async function readJson(request: Request,env?:Env) {
  assertSameOrigin(request,env);
  const mediaType = request.headers.get("content-type")?.split(";")[0].trim();
  if (mediaType !== "application/json") {
    throw new AuthError(415, "請使用 application/json。");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError(400, "缺少 JSON 內容。");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        throw new AuthError(413, "請求內容過大。");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new AuthError(400, "JSON 格式錯誤。");
  }
}

export function credentials(body: Record<string, unknown>, registering = false) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError(400, "請輸入有效的 Email。");
  }
  // Do not trim, normalize, or silently truncate passwords.
  if (password.length < (registering ? 12 : 1) || encoder.encode(password).length > 256) {
    throw new AuthError(400, "密碼至少 12 個字元，且不可超過 256 UTF-8 位元組。");
  }
  if (registering && (displayName.length < 1 || displayName.length > 50)) {
    throw new AuthError(400, "顯示名稱須為 1–50 個字元。");
  }
  return { email, password, displayName };
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}

async function derivePassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(salt), iterations: ITERATIONS },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = toHex(await derivePassword(password, salt));
  return { salt, password_hash: `${HASH_PREFIX}${hash}` };
}

export async function verifyPassword(password: string, storedHash: string, salt: string) {
  if (!/^[a-f0-9]{32}$/.test(salt) || !storedHash.startsWith(HASH_PREFIX)) return false;
  const expectedHex = storedHash.slice(HASH_PREFIX.length);
  if (!/^[a-f0-9]{64}$/.test(expectedHex)) return false;
  const actual = await derivePassword(password, salt);
  const expected = fromHex(expectedHex);
  // Use native HMAC verification to avoid an early-exit JS hash comparison.
  const key = await crypto.subtle.importKey(
    "raw", crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, expected);
  return crypto.subtle.verify("HMAC", key, signature, actual);
}

export async function prepareSession(userId: string, env: Env) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId).setJti(id).setIssuedAt(now).setExpirationTime(expiresAt)
    .setIssuer(ISSUER).setAudience(AUDIENCE).sign(signingKey(env));
  return { id, token, expiresAt };
}

function cookieSettings(request: Request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  if (!secure && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Authentication requires HTTPS");
  }
  return { secure, name: secure ? "__Host-fit_session" : "fit_session" };
}

export function setSessionCookie(response: Response, request: Request, token: string | null,env?:Env) {
  const { secure, name } = cookieSettings(request);
  const partitioned=secure && frontendOrigin(env)!==null;
  response.headers.append("Set-Cookie", [
    `${name}=${token ?? ""}`, "Path=/", "HttpOnly", partitioned?"SameSite=None":"SameSite=Lax",
    `Max-Age=${token ? SESSION_TTL : 0}`,
    ...(secure ? ["Secure"] : []),
    ...(partitioned?["Partitioned"]:[]),
    ...(!token ? ["Expires=Thu, 01 Jan 1970 00:00:00 GMT"] : []),
  ].join("; "));
  return response;
}

export async function readSession(request: Request, env: Env) {
  const { name } = cookieSettings(request);
  const pair = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  const token = pair?.slice(name.length + 1);
  if (!token || token.length > 2048) return null;
  const key = signingKey(env);
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"], typ: "JWT", issuer: ISSUER, audience: AUDIENCE,
      requiredClaims: ["sub", "jti", "iat", "exp"], maxTokenAge: "7d",
    });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") return null;
    return { userId: payload.sub, id: payload.jti };
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export async function requireUser(request: Request, env: Env): Promise<PublicUser> {
  const session = await readSession(request, env);
  if (!session) throw new AuthError(401, "請先登入。");
  const user = await getDb(env).prepare(`
    SELECT u.id, u.email, u.display_name, u.created_at
    FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.user_id = ? AND s.expires_at > ?
  `).bind(session.id, session.userId, Math.floor(Date.now() / 1000)).first<PublicUser>();
  if (!user) throw new AuthError(401, "登入已過期，請重新登入。");
  return user;
}

export async function rateLimit(request: Request, env: Env, action: "login" | "register") {
  // Cloudflare supplies this header at the edge. Never use client X-Forwarded-For.
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${action}:${ip}`));
  const bucket = toHex(new Uint8Array(digest));
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 900) * 900;
  const limit = action === "register" ? 5 : 20;
  const row = await getDb(env).prepare(`
    INSERT INTO auth_rate_limits (bucket_key, window_start, attempts) VALUES (?, ?, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET
      attempts = CASE WHEN auth_rate_limits.window_start = excluded.window_start
        THEN MIN(auth_rate_limits.attempts + 1, 1000) ELSE 1 END,
      window_start = excluded.window_start
    RETURNING attempts
  `).bind(bucket, windowStart, 1).first<{ attempts: number }>();
  if (!row) throw new Error("Rate limit update failed");
  if (row.attempts > limit) throw new AuthError(429, "操作太頻繁，請稍後再試。", windowStart + 900 - now);
}

export function isEmailConflict(error: unknown): boolean {
  return error instanceof Error && (
    /UNIQUE constraint failed: users\.email/i.test(error.message) ||
    (error.cause !== error && isEmailConflict(error.cause))
  );
}
