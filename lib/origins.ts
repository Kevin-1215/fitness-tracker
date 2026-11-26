import type { Env } from "./env";

/** Exactly one trusted frontend origin. Never reflect an arbitrary Origin. */
export function frontendOrigin(env?: Pick<Env,"FRONTEND_ORIGIN">): string | null {
  if (!env?.FRONTEND_ORIGIN) return null;
  const url=new URL(env.FRONTEND_ORIGIN);
  if(url.origin!==env.FRONTEND_ORIGIN || url.protocol!=="https:")throw new Error("FRONTEND_ORIGIN must be an exact HTTPS origin without a path or trailing slash");
  return url.origin;
}
export function allowedOrigin(request:Request,env?:Pick<Env,"FRONTEND_ORIGIN">) {
  const origin=request.headers.get("Origin");
  return origin!==null && (origin===new URL(request.url).origin || origin===frontendOrigin(env));
}
