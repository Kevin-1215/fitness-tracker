import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";

// Run after `pnpm run build`; test the actual Wrangler-generated Pages router.
const mf = new Miniflare({
  modules: true, scriptPath: "dist-worker/index.js", compatibilityDate: "2026-07-01",
  bindings: { JWT_SECRET: "routing-test-only-" + "y".repeat(48) },
  d1Databases: { DB: "pages-routing-test" },
  serviceBindings: { ASSETS: () => new Response("Not found", { status: 404 }) },
});

try {
  const db = await mf.getD1Database("DB");
  const schema = await readFile("schema.sql", "utf8");
  for (const sql of schema.replace(/--[^\n]*/g, "").split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(sql).run();
  }
  const origin = "https://fitness.example";
  assert.equal((await mf.dispatchFetch(`${origin}/api/auth/me`)).status, 401);
  const wrongMethod = await mf.dispatchFetch(`${origin}/api/auth/register`);
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "POST");
  assert.equal((await mf.dispatchFetch(`${origin}/api/unknown`)).status, 404);
  const registration = await mf.dispatchFetch(`${origin}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ email: "routing@example.com", password: "a strong routing password", display_name: "Router" }),
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get("set-cookie").split(";")[0];
  const me = await mf.dispatchFetch(`${origin}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, "routing@example.com");
  const request = (path,method="GET",body) => mf.dispatchFetch(`${origin}${path}`,{method,headers:{Cookie:cookie,Origin:origin,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  for(const path of ["profile","workouts","nutrition"])assert.equal((await mf.dispatchFetch(`${origin}/api/${path}`)).status,401);
  assert.equal((await request("/api/profile","POST",{height_cm:175,weight_kg:75,age:30,gender:"male",activity_level:1.55,goal_type:"lose"})).status,200);
  assert.equal((await (await request("/api/profile")).json()).metrics.target_calories,2238);
  const workout=await request("/api/workouts","POST",{log_date:"2026-11-26",exercise_code:"bench_press",weight_kg:60,reps:10});assert.equal(workout.status,201);const workoutId=(await workout.json()).entry.id;
  assert.equal((await (await request("/api/workouts?date=2026-11-26&exercise_code=bench_press")).json()).history.pr_weight_kg,60);
  assert.equal((await request(`/api/workouts?id=${workoutId}`,"DELETE")).status,200);
  const meal=await request("/api/nutrition","POST",{log_date:"2026-11-26",meal_type:"lunch",food_name:"雞胸肉",calories:165,protein_g:31,carbs_g:0,fat_g:3.6});assert.equal(meal.status,201);const mealId=(await meal.json()).entry.id;
  assert.equal((await (await request("/api/nutrition?date=2026-11-26")).json()).totals.calories,165);
  assert.equal((await request(`/api/nutrition?id=${mealId}`,"DELETE")).status,200);
  const profileMethod=await request("/api/profile","PUT");assert.equal(profileMethod.status,405);assert.equal(profileMethod.headers.get("allow"),"GET, POST");
  console.log("Pages router smoke checks passed: auth, profile, workouts, nutrition CRUD, 401, 404, 405.");
} finally {
  await mf.dispose();
}
