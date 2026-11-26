import { AuthError, assertSameOrigin, authError, getDb, json, readJson, requireUser } from "../../lib/auth";
import type { AppContext, Env } from "../../lib/env";
import { exerciseById } from "../../lib/exercisesData";
import { round1, type WorkoutLog, type WorkoutResponse } from "../../lib/fitness";
import { dateKey, numeric, queryDate, recordId, text } from "../../lib/validation";

export const runtime = "edge";
function exerciseCode(value: unknown) {
  const code = text(value, "動作代碼", 80);
  if (!exerciseById.has(code)) throw new AuthError(400, "找不到此動作。");
  return code;
}

export async function readWorkoutDay(env: Env, userId: string, date: string, code: string | null): Promise<WorkoutResponse> {
  const db = getDb(env);
  const statements = [db.prepare("SELECT * FROM workout_logs WHERE user_id = ? AND log_date = ? ORDER BY exercise_code, set_number, id").bind(userId,date)];
  if (code) statements.push(
    db.prepare("SELECT MAX(weight_kg) AS pr_weight_kg FROM workout_logs WHERE user_id = ? AND exercise_code = ? AND log_date <= ? AND reps > ?").bind(userId,code,date,0),
    db.prepare(`SELECT * FROM workout_logs WHERE user_id = ? AND exercise_code = ? AND log_date =
      (SELECT MAX(log_date) FROM workout_logs WHERE user_id = ? AND exercise_code = ? AND log_date < ?) ORDER BY set_number, id`).bind(userId,code,userId,code,date),
  );
  const result = await db.batch(statements), logs = result[0].results as unknown as WorkoutLog[];
  const previous = code ? result[2].results as unknown as WorkoutLog[] : [];
  const pr = code ? (result[1].results[0] as { pr_weight_kg: number | null }).pr_weight_kg : null;
  return { date, logs, total_sets:logs.length, volume_kg:round1(logs.reduce((sum,row) => sum+row.weight_kg*row.reps,0)),
    history: code ? { exercise_code:code, pr_weight_kg:pr, last_date:previous[0]?.log_date ?? null, last_sets:previous } : null };
}

export async function onRequestGet({ request, env }: AppContext) {
  try {
    const user = await requireUser(request,env), date = queryDate(request);
    const rawCode = new URL(request.url).searchParams.get("exercise_code"), code = rawCode === null ? null : exerciseCode(rawCode);
    return json(await readWorkoutDay(env,user.id,date,code));
  } catch (error) { return authError(error); }
}
export async function onRequestPost({ request, env }: AppContext) {
  try {
    const user = await requireUser(request,env), body = await readJson(request,env);
    const code = exerciseCode(body.exercise_code), date = dateKey(body.log_date), exercise = exerciseById.get(code)!;
    const weight = numeric(body.weight_kg,"重量",0,1500), reps = numeric(body.reps,"次數",1,1000,true);
    const notes = text(body.notes ?? "","備註",500,true);
    // MAX + INSERT 在同一條 SQLite statement 中執行，並行新增也不會算到相同組號。
    const entry = await getDb(env).prepare(`INSERT INTO workout_logs
      (id,user_id,log_date,exercise_code,exercise_name,set_number,weight_kg,reps,notes)
      SELECT ?,?,?,?,?,COALESCE(MAX(set_number),0)+1,?,?,? FROM workout_logs
      WHERE user_id = ? AND log_date = ? AND exercise_code = ? RETURNING *`)
      .bind(crypto.randomUUID(),user.id,date,code,exercise.name,weight,reps,notes,user.id,date,code).first<WorkoutLog>();
    return json({ entry, ...await readWorkoutDay(env,user.id,date,code) },201);
  } catch (error) { return authError(error); }
}
export async function onRequestDelete({ request, env }: AppContext) {
  try {
    const user = await requireUser(request,env); assertSameOrigin(request,env);
    const id = recordId(request);
    const deleted = await getDb(env).prepare("DELETE FROM workout_logs WHERE id = ? AND user_id = ? RETURNING id").bind(id,user.id).first<{ id: string }>();
    if (!deleted) throw new AuthError(404,"找不到此訓練紀錄。");
    return json({ deleted_id: deleted.id });
  } catch (error) { return authError(error); }
}
