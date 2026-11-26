import { AuthError } from "./auth";
import { isDateKey, todayInTaipei } from "./fitness";

export function numeric(value: unknown, label: string, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value)) throw new AuthError(400, `${label}須為 ${min}–${max} 的${integer ? "整數" : "數值"}。`);
  return value;
}
export function text(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string" || !allowEmpty && !value.trim() || typeof value === "string" && value.trim().length > max) throw new AuthError(400, `${label}格式錯誤，最多 ${max} 個字元。`);
  return value.trim();
}
export function oneOf<T extends string | number>(value: unknown, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new AuthError(400, `${label}選項不正確。`);
  return value as T;
}
export function dateKey(value: unknown): string {
  if (!isDateKey(value)) throw new AuthError(400, "日期須為有效的 YYYY-MM-DD。");
  return value;
}
export function queryDate(request: Request) { return dateKey(new URL(request.url).searchParams.get("date") ?? todayInTaipei()); }
export function recordId(request: Request) { return text(new URL(request.url).searchParams.get("id"), "紀錄 ID", 128); }
