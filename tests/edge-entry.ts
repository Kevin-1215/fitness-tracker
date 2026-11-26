import { onRequestPost as register } from "../functions/api/auth/register";
import { onRequestPost as login } from "../functions/api/auth/login";
import { onRequestPost as logout } from "../functions/api/auth/logout";
import { onRequestGet as me } from "../functions/api/auth/me";
import { hashPassword, json, verifyPassword } from "../lib/auth";
import type { Env } from "../lib/env";
import * as profile from "../functions/api/profile";
import * as workouts from "../functions/api/workouts";
import * as nutrition from "../functions/api/nutrition";

export default {
  async fetch(request: Request, env: Env) {
    const path = new URL(request.url).pathname;
    const routes: Record<string,Record<string,((context:{request:Request;env:Env}) => Promise<Response>) | undefined>> = {
      "/api/profile":{GET:profile.onRequestGet,POST:profile.onRequestPost},
      "/api/workouts":{GET:workouts.onRequestGet,POST:workouts.onRequestPost,DELETE:workouts.onRequestDelete},
      "/api/nutrition":{GET:nutrition.onRequestGet,POST:nutrition.onRequestPost,DELETE:nutrition.onRequestDelete},
    };
    const handler=routes[path]?.[request.method]; if(handler) return handler({request,env});
    if (path === "/api/auth/register" && request.method === "POST") return register({ request, env });
    if (path === "/api/auth/login" && request.method === "POST") return login({ request, env });
    if (path === "/api/auth/logout" && request.method === "POST") return logout({ request, env });
    if (path === "/api/auth/me" && request.method === "GET") return me({ request, env });
    if (path === "/__test/crypto") {
      const first = await hashPassword("very long password");
      const second = await hashPassword("very long password");
      return json({
        distinct: first.salt !== second.salt && first.password_hash !== second.password_hash,
        correct: await verifyPassword("very long password", first.password_hash, first.salt),
        wrong: await verifyPassword("wrong password", first.password_hash, first.salt),
        corrupt: await verifyPassword("very long password", "broken", first.salt),
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
