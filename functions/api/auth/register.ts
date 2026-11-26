import {
  AuthError, authError, credentials, getDb, hashPassword,
  isEmailConflict, json, prepareSession, rateLimit, readJson, setSessionCookie,
} from "../../../lib/auth";
import type { AppContext } from "../../../lib/env";

export async function onRequestPost({ request, env }: AppContext) {
  try {
    const body = await readJson(request,env);
    await rateLimit(request, env, "register");
    const { email, password, displayName } = credentials(body, true);
    const { password_hash, salt } = await hashPassword(password);
    const user = {
      id: crypto.randomUUID(), email, display_name: displayName,
      created_at: new Date().toISOString(),
    };
    // Sign before committing so a missing/invalid secret cannot create a partial account.
    const session = await prepareSession(user.id, env);
    const db = getDb(env);
    const now = Math.floor(Date.now() / 1000);
    try {
      // D1 batch is transactional: account, profile, and session commit together.
      await db.batch([
        db.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").bind(now),
        db.prepare("DELETE FROM auth_rate_limits WHERE window_start < ?").bind(now - 86400),
        db.prepare(`INSERT INTO users
          (id, email, password_hash, salt, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(user.id, email, password_hash, salt, displayName, user.created_at),
        db.prepare("INSERT INTO profiles (user_id) VALUES (?)").bind(user.id),
        db.prepare("INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
          .bind(session.id, user.id, session.expiresAt),
      ]);
    } catch (error) {
      if (isEmailConflict(error)) throw new AuthError(409, "此 Email 已被註冊。");
      throw error;
    }
    return setSessionCookie(json({ user }, 201), request, session.token,env);
  } catch (error) {
    return authError(error);
  }
}
