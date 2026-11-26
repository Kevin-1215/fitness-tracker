import {
  AuthError, authError, credentials, getDb, json, prepareSession,
  rateLimit, readJson, setSessionCookie, verifyPassword, type LoginUser,
} from "../../../lib/auth";
import type { AppContext } from "../../../lib/env";

export async function onRequestPost({ request, env }: AppContext) {
  try {
    const body = await readJson(request,env);
    await rateLimit(request, env, "login");
    const { email, password } = credentials(body);
    const db = getDb(env);
    const user = await db.prepare(`
      SELECT id, email, password_hash, salt, display_name, created_at
      FROM users WHERE email = ?
    `).bind(email).first<LoginUser>();
    // A missing account still performs the same expensive password derivation.
    const valid = await verifyPassword(
      password,
      user?.password_hash ?? `pbkdf2-sha256$100000$${"0".repeat(64)}`,
      user?.salt ?? "0".repeat(32),
    );
    if (!user || !valid) throw new AuthError(401, "Email 或密碼不正確。");
    const session = await prepareSession(user.id, env);
    await db.batch([
      db.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").bind(Math.floor(Date.now() / 1000)),
      db.prepare("DELETE FROM auth_rate_limits WHERE window_start < ?").bind(Math.floor(Date.now() / 1000) - 86400),
      db.prepare("INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(session.id, user.id, session.expiresAt),
    ]);
    const publicUser = {
      id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at,
    };
    return setSessionCookie(json({ user: publicUser }), request, session.token,env);
  } catch (error) {
    return authError(error);
  }
}
