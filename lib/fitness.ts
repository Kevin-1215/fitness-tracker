export const ACTIVITY_LEVELS = [1.2, 1.375, 1.55, 1.725, 1.9] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalType = "lose" | "maintain" | "gain";
export interface ProfileInput {
  height_cm: number; weight_kg: number; age: number; gender: "male" | "female";
  activity_level: ActivityLevel; goal_type: GoalType;
}
export interface ProfileRow {
  user_id: string; height_cm: number | null; weight_kg: number | null; age: number | null;
  gender: string | null; activity_level: number; goal_type: GoalType; target_calories: number | null;
}
export interface EnergyMetrics {
  bmr: number; tdee: number; target_calories: number; goal_adjustment_pct: number;
  formula: "Mifflin-St Jeor";
}
export interface ProfileResponse { profile: ProfileRow | null; metrics: EnergyMetrics | null }
export interface WorkoutLog {
  id: string; user_id: string; log_date: string; exercise_code: string; exercise_name: string;
  set_number: number; weight_kg: number; reps: number; notes: string;
}
export interface WorkoutHistory { exercise_code: string; pr_weight_kg: number | null; last_date: string | null; last_sets: WorkoutLog[] }
export interface WorkoutResponse { date: string; logs: WorkoutLog[]; history: WorkoutHistory | null; total_sets: number; volume_kg: number }
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_LABELS: Record<MealType, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心／加餐" };
export interface NutritionLog {
  id: string; user_id: string; log_date: string; meal_type: MealType; food_name: string;
  calories: number; protein_g: number; carbs_g: number|null; fat_g: number|null;
}
export interface NutritionTotals { calories: number; protein_g: number; carbs_g: number; fat_g: number; carbs_unknown_count:number; fat_unknown_count:number }
export interface NutritionResponse { date: string; logs: NutritionLog[]; totals: NutritionTotals }

/** 成人常用的 Mifflin-St Jeor 簡化式。目標係數是本應用的可見設定。 */
export function calculateEnergy(input: ProfileInput): EnergyMetrics {
  const rawBmr = 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + (input.gender === "male" ? 5 : -161);
  const rawTdee = rawBmr * input.activity_level;
  const adjustment = input.goal_type === "lose" ? -.15 : input.goal_type === "gain" ? .10 : 0;
  return { bmr: Math.round(rawBmr), tdee: Math.round(rawTdee), target_calories: Math.round(rawTdee * (1 + adjustment)), goal_adjustment_pct: Math.round(adjustment * 100), formula: "Mifflin-St Jeor" };
}

export function metricsForProfile(profile: ProfileRow | null): EnergyMetrics | null {
  if (!profile || profile.height_cm === null || profile.weight_kg === null || profile.age === null || !["male","female"].includes(profile.gender ?? "") || !ACTIVITY_LEVELS.includes(profile.activity_level as ActivityLevel)) return null;
  return calculateEnergy(profile as ProfileRow & ProfileInput);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function todayInTaipei() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function localDateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export const round1 = (value: number) => Math.round(value * 10) / 10;
export function sumNutrition(logs: readonly NutritionLog[]): NutritionTotals {
  const totals=logs.reduce<NutritionTotals>((total, row) => ({ calories: total.calories + row.calories, protein_g: total.protein_g + row.protein_g, carbs_g: total.carbs_g + (row.carbs_g??0), fat_g: total.fat_g + (row.fat_g??0), carbs_unknown_count:total.carbs_unknown_count+(row.carbs_g===null?1:0), fat_unknown_count:total.fat_unknown_count+(row.fat_g===null?1:0) }), { calories:0, protein_g:0, carbs_g:0, fat_g:0,carbs_unknown_count:0,fat_unknown_count:0 });
  return {...totals,protein_g:round1(totals.protein_g),carbs_g:round1(totals.carbs_g),fat_g:round1(totals.fat_g)};
}
