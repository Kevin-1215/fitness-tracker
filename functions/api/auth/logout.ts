import {
  assertSameOrigin, authError, getDb, json, readSession, setSessionCookie,
} from "../../../lib/auth";
import type { AppContext } from "../../../lib/env";

export async function onRequestPost({ request, env }: AppContext) {
  try {
    assertSameOrigin(request,env);
    const session = await readSession(request, env);
    if (session) {
      await getDb(env).prepare("DELETE FROM auth_sessions WHERE id = ? AND user_id = ?")
        .bind(session.id, session.userId).run();
    }
    return setSessionCookie(json({ ok: true }), request, null,env);
  } catch (error) {
    return authError(error);
  }
}
