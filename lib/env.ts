import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  FRONTEND_ORIGIN?: string;
}

export interface AppContext {
  request: Request;
  env: Env;
}
