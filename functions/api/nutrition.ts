import { AuthError, assertSameOrigin, authError, getDb, json, readJson, requireUser } from "../../lib/auth";
import type { AppContext, Env } from "../../lib/env";
import { sumNutrition, type NutritionLog, type NutritionResponse } from "../../lib/fitness";
import { dateKey, numeric, oneOf, queryDate, recordId, text } from "../../lib/validation";

export const runtime = "edge";
export async function readNutritionDay(env: Env, userId: string, date: string): Promise<NutritionResponse> {
  const result = await getDb(env).prepare("SELECT * FROM nutrition_logs WHERE user_id = ? AND log_date = ? ORDER BY meal_type, rowid").bind(userId,date).all<NutritionLog>();
  return { date, logs:result.results, totals:sumNutrition(result.results) };
}
export async function onRequestGet({ request, env }: AppContext) {
  try { const user = await requireUser(request,env); return json(await readNutritionDay(env,user.id,queryDate(request))); }
  catch (error) { return authError(error); }
}
export async function onRequestPost({ request, env }: AppContext) {
  try {
    const user = await requireUser(request,env), body = await readJson(request,env), date = dateKey(body.log_date);
    const meal = oneOf(body.meal_type,["breakfast","lunch","dinner","snack"] as const,"餐別");
    const name = text(body.food_name,"食物名稱",120), calories = numeric(body.calories,"熱量",0,10000,true);
    const protein = numeric(body.protein_g,"蛋白質",0,1000), carbs = numeric(body.carbs_g,"碳水化合物",0,1000), fat = numeric(body.fat_g,"脂肪",0,1000);
    const entry = await getDb(env).prepare(`INSERT INTO nutrition_logs (id,user_id,log_date,meal_type,food_name,calories,protein_g,carbs_g,fat_g)
      VALUES (?,?,?,?,?,?,?,?,?) RETURNING *`).bind(crypto.randomUUID(),user.id,date,meal,name,calories,protein,carbs,fat).first<NutritionLog>();
    return json({ entry, ...await readNutritionDay(env,user.id,date) },201);
  } catch (error) { return authError(error); }
}
export async function onRequestDelete({ request, env }: AppContext) {
  try {
    const user = await requireUser(request,env); assertSameOrigin(request,env);
    const deleted = await getDb(env).prepare("DELETE FROM nutrition_logs WHERE id = ? AND user_id = ? RETURNING id").bind(recordId(request),user.id).first<{ id:string }>();
    if (!deleted) throw new AuthError(404,"找不到此飲食紀錄。");
    return json({ deleted_id: deleted.id });
  } catch (error) { return authError(error); }
}
