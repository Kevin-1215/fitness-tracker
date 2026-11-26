import { json } from "../../lib/auth";

// Keep unknown API paths and unsupported methods from falling through to SPA HTML.
export function onRequest({ request }: { request: Request }) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");
  const allowed = new Map([
    ["/api/auth/register", "POST"], ["/api/auth/login", "POST"],
    ["/api/auth/logout", "POST"], ["/api/auth/me", "GET"],
    ["/api/profile", "GET, POST"], ["/api/workouts", "GET, POST, DELETE"], ["/api/nutrition", "GET, POST, DELETE"],
  ]).get(pathname);
  if (allowed) {
    const response = json({ error: "不支援此 HTTP 方法。" }, 405);
    response.headers.set("Allow", allowed);
    return response;
  }
  return json({ error: "找不到 API。" }, 404);
}
