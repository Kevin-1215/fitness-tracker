import { AuthError, authError, json, requireUser, setSessionCookie } from "../../../lib/auth";
import type { AppContext } from "../../../lib/env";

export async function onRequestGet({ request, env }: AppContext) {
  try {
    return json({ user: await requireUser(request, env) });
  } catch (error) {
    const response = authError(error);
    return error instanceof AuthError && error.status === 401
      ? setSessionCookie(response, request, null,env)
      : response;
  }
}
