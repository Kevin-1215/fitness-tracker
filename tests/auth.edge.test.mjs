import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { build } from "esbuild";
import { Miniflare } from "miniflare";

const origin = "https://fitness.example";
const password = "a strong test password";
let mf;
let db;

before(async () => {
  const result = await build({
    entryPoints: ["tests/edge-entry.ts"], bundle: true, write: false,
    format: "esm", platform: "browser", target: "es2022",
  });
  mf = new Miniflare({
    modules: true, script: result.outputFiles[0].text,
    compatibilityDate: "2026-07-01",
    d1Databases: { DB: "fitness-auth-test" },
    bindings: { JWT_SECRET: "test-only-secret-" + "x".repeat(48) },
  });
  db = await mf.getD1Database("DB");
  const schema = await readFile("schema.sql", "utf8");
  const statements = schema.replace(/--[^\n]*/g, "").split(";")
    .map((sql) => sql.trim()).filter(Boolean);
  for (const sql of statements) await db.prepare(sql).run();
});

after(async () => { await mf?.dispose(); });

function call(route, { method = "GET", body, cookie, ip = "203.0.113.1", source = origin } = {}) {
  const headers = { Origin: source, "CF-Connecting-IP": ip };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  return mf.dispatchFetch(`${origin}${route}`, {
    method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const cookieOf = (response) => response.headers.get("set-cookie")?.split(";")[0];

test("PBKDF2 salts differ; valid, incorrect and corrupt passwords are handled in workerd", async () => {
  const response = await call("/__test/crypto");
  assert.deepEqual(await response.json(), { distinct: true, correct: true, wrong: false, corrupt: false });
});

test("two accounts remain isolated and logout revokes only that session", async () => {
  const alice = await call("/api/auth/register", {
    method: "POST", body: { email: " Alice@Example.com ", password, display_name: "Alice" },
  });
  assert.equal(alice.status, 201);
  const aliceCookie = cookieOf(alice);
  const { user: aliceUser } = await alice.json();
  assert.equal(aliceUser.email, "alice@example.com");
  assert.equal(aliceUser.password_hash, undefined);
  assert.match(alice.headers.get("set-cookie"), /HttpOnly/);
  assert.match(alice.headers.get("set-cookie"), /Secure/);
  assert.match(alice.headers.get("set-cookie"), /SameSite=Lax/);
  assert.match(alice.headers.get("set-cookie"), /^__Host-fit_session=/);
  assert.match(alice.headers.get("cache-control"), /no-store/);

  const bob = await call("/api/auth/register", {
    method: "POST", body: { email: "bob@example.com", password, display_name: "Bob" },
  });
  assert.equal(bob.status, 201);
  const bobCookie = cookieOf(bob);
  const { user: bobUser } = await bob.json();
  assert.notEqual(aliceUser.id, bobUser.id);
  const aliceMe = await call(`/api/auth/me?user_id=${bobUser.id}`, { cookie: aliceCookie });
  assert.equal((await aliceMe.json()).user.id, aliceUser.id);
  assert.equal((await (await call("/api/auth/me", { cookie: bobCookie })).json()).user.id, bobUser.id);
  const profiles = await db.prepare("SELECT user_id FROM profiles").all();
  assert.ok(profiles.results.some((row) => row.user_id === aliceUser.id));

  const login = await call("/api/auth/login", {
    method: "POST", body: { email: "ALICE@example.com", password },
  });
  assert.equal(login.status, 200);
  const otherAliceSession = cookieOf(login);
  assert.equal((await call("/api/auth/logout", { method: "POST", cookie: aliceCookie })).status, 200);
  assert.equal((await call("/api/auth/me", { cookie: aliceCookie })).status, 401);
  assert.equal((await call("/api/auth/me", { cookie: otherAliceSession })).status, 200);
  assert.equal((await call("/api/auth/me", { cookie: bobCookie })).status, 200);

  const badCookie = otherAliceSession.slice(0, -12) + "tampered-jwt";
  assert.equal((await call("/api/auth/me", { cookie: badCookie })).status, 401);
  const sessionId = JSON.parse(atob(otherAliceSession.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).jti;
  await db.prepare("UPDATE auth_sessions SET expires_at = ? WHERE id = ?").bind(1, sessionId).run();
  assert.equal((await call("/api/auth/me", { cookie: otherAliceSession })).status, 401);
});

test("duplicate registrations race safely; no orphan profiles or sessions", async () => {
  const body = { email: "race@example.com", password, display_name: "Race" };
  const results = await Promise.all([
    call("/api/auth/register", { method: "POST", body, ip: "203.0.113.2" }),
    call("/api/auth/register", { method: "POST", body, ip: "203.0.113.3" }),
  ]);
  assert.deepEqual(results.map((response) => response.status).sort(), [201, 409]);
  const counts = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM users WHERE email = ?) AS users,
    (SELECT COUNT(*) FROM profiles WHERE user_id NOT IN (SELECT id FROM users)) AS orphans
  `).bind(body.email).first();
  assert.deepEqual(counts, { users: 1, orphans: 0 });
});

test("wrong passwords and nonexistent accounts return the same error", async () => {
  const wrong = await call("/api/auth/login", {
    method: "POST", body: { email: "alice@example.com", password: "wrong password" },
  });
  const absent = await call("/api/auth/login", {
    method: "POST", body: { email: "missing@example.com", password },
  });
  assert.equal(wrong.status, 401);
  assert.equal(absent.status, 401);
  assert.deepEqual(await wrong.json(), await absent.json());
});

test("cross-origin writes, invalid credentials and oversized bodies are rejected", async () => {
  assert.equal((await call("/api/auth/logout", { method: "POST", source: "https://evil.example" })).status, 403);
  assert.equal((await call("/api/auth/register", {
    method: "POST", body: { email: "bad", password, display_name: "Invalid" },
  })).status, 400);
  assert.equal((await call("/api/auth/register", {
    method: "POST", body: { email: "short@example.com", password: "short", display_name: "Invalid" },
  })).status, 400);
  assert.equal((await call("/api/auth/login", { method: "POST", body: { data: "x".repeat(5000) } })).status, 413);
  assert.equal((await call("/api/auth/me")).status, 401);
});

test("SQL metacharacters are treated as bound values", async () => {
  const response = await call("/api/auth/register", {
    method: "POST", ip: "203.0.113.4",
    body: { email: "bound@example.com", password, display_name: "Robert'); DROP TABLE users;--" },
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.display_name, "Robert'); DROP TABLE users;--");
  assert.ok((await db.prepare("SELECT COUNT(*) AS total FROM users").first()).total >= 4);
});

test("D1 rate limit is shared and returns Retry-After", async () => {
  for (let index = 0; index < 20; index++) {
    const response = await call("/api/auth/login", { method: "POST", body: {}, ip: "203.0.113.99" });
    assert.equal(response.status, 400);
  }
  const limited = await call("/api/auth/login", { method: "POST", body: {}, ip: "203.0.113.99" });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
});
