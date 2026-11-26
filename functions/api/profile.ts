import { authError, getDb, json, readJson, requireUser } from "../../lib/auth";
import type { AppContext } from "../../lib/env";
import { ACTIVITY_LEVELS, calculateEnergy, metricsForProfile, type ProfileInput, type ProfileRow } from "../../lib/fitness";
import { numeric, oneOf } from "../../lib/validation";

export const runtime = "edge";

export async function onRequestGet({ request, env }: AppContext) {
  try {
    const user = await requireUser(request, env);
    const profile = await getDb(env).prepare("SELECT user_id, height_cm, weight_kg, age, gender, activity_level, goal_type, target_calories FROM profiles WHERE user_id = ?").bind(user.id).first<ProfileRow>();
    return json({ profile, metrics: metricsForProfile(profile) });
  } catch (error) { return authError(error); }
}

export async function onRequestPost({ request, env }: AppContext) {
  try {
    const user = await requireUser(request, env), body = await readJson(request,env);
    const input: ProfileInput = {
      height_cm: numeric(body.height_cm, "身高", 100, 250), weight_kg: numeric(body.weight_kg, "體重", 25, 350),
      age: numeric(body.age, "年齡", 18, 100, true), gender: oneOf(body.gender, ["male","female"] as const, "熱量公式"),
      activity_level: oneOf(body.activity_level, ACTIVITY_LEVELS, "活動量"), goal_type: oneOf(body.goal_type, ["lose","maintain","gain"] as const, "訓練目標"),
    };
    const metrics = calculateEnergy(input);
    const profile = await getDb(env).prepare(`INSERT INTO profiles (user_id,height_cm,weight_kg,age,gender,activity_level,goal_type,target_calories)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET height_cm=excluded.height_cm,weight_kg=excluded.weight_kg,age=excluded.age,
      gender=excluded.gender,activity_level=excluded.activity_level,goal_type=excluded.goal_type,target_calories=excluded.target_calories RETURNING *`)
      .bind(user.id,input.height_cm,input.weight_kg,input.age,input.gender,input.activity_level,input.goal_type,metrics.target_calories).first<ProfileRow>();
    return json({ profile, metrics });
  } catch (error) { return authError(error); }
}
