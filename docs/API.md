# 儀表板 API

所有業務 API 先驗證 HttpOnly JWT Cookie 與 D1 session，再使用 session 的 `user.id`；不採信 body 或 query 的 `user_id`。SQL 的使用者輸入全部透過 `prepare().bind()`，會員回應使用 `private, no-store`。寫入需要有效的 Origin；JSON body 上限 4 KiB。

| 方法 | 路徑 | 內容 |
|---|---|---|
| GET | `/api/profile` | 回傳 `profile` 與 `metrics`，資料未設定時 metrics 為 null |
| POST | `/api/profile` | 完整更新身體設定，伺服器重新計算目標 |
| GET | `/api/workouts?date=2026-11-26&exercise_code=bench_press` | 日期全部組數、總訓練量，以及選定動作的歷史資料 |
| POST | `/api/workouts` | 新增一組，回傳 entry 與更新後日期資料 |
| DELETE | `/api/workouts?id=UUID` | 僅刪除自己的紀錄；不存在或屬於別人都回 404 |
| GET | `/api/nutrition?date=2026-11-26` | 指定日期的飲食與 kcal、P/C/F 加總 |
| POST | `/api/nutrition` | 新增飲食，回傳 entry 與更新後日期資料 |
| DELETE | `/api/nutrition?id=UUID` | 僅刪除自己的飲食 |

日期省略時，API 使用 Asia/Taipei 當天；前端使用使用者裝置的日期選擇器，並明確傳入日期。API 會驗證真實日曆日期，拒絕 2 月 30 日等無效值。

## Profile

```json
{"height_cm":175,"weight_kg":75,"age":30,"gender":"male","activity_level":1.55,"goal_type":"lose"}
```

成人輸入範圍：身高 100–250 cm、體重 25–350 kg、年齡 18–100 整數；活動係數為 1.2、1.375、1.55、1.725、1.9。gender 選 male／female，介面標明這是公式係數。goal_type 為 lose／maintain／gain。

Mifflin-St Jeor 成人簡化式：`BMR = 10×kg + 6.25×cm − 5×age + (male:5 / female:−161)`；`TDEE = BMR×activity_level`。本應用減脂目標設定為 TDEE −15%，增肌 +10%，維持不調整。BMR、TDEE 與每日目標各從未四捨五入的計算值取整數，不連續累積四捨五入誤差。這些是估算與應用預設，並非個人化營養處方。[原始研究](https://pubmed.ncbi.nlm.nih.gov/2305711/)

## Workouts

```json
{"log_date":"2026-11-26","exercise_code":"bench_press","weight_kg":60,"reps":10,"notes":"最後兩下較吃力"}
```

重量 0–1500 kg，次數 1–1000 整數，備註最多 500 字元。動作代碼必須在內建 26 個動作中，名稱由伺服器填入。組號以同一條 SQLite INSERT SELECT MAX statement 產生，避免並行新增計算到相同組號。刪除後保留既有組號，不重新編排。

`history.pr_weight_kg` 為截至選定日期、有效次數大於零的最高重量；`last_date` 與 `last_sets` 為該日期之前最近一天的同動作紀錄。未指定 exercise_code 時 history 為 null。總訓練量是每組 kg×reps 的加總，徒手重量填 0。

## Nutrition

```json
{"log_date":"2026-11-26","meal_type":"lunch","food_name":"雞胸肉（熟）100 g","calories":165,"protein_g":31,"carbs_g":0,"fat_g":3.6}
```

meal_type 為 breakfast／lunch／dinner／snack；名稱最多 120 字元；熱量 0–10000 整數，三大營養素各 0–1000 g。加總最後才四捨五入至一位小數。20 種捷徑標明份量，數值為可編輯的估算，並非外部食品資料庫查詢。

## UI 與驗證

`app/dashboard/page.tsx` 匯入 WorkoutTab／NutritionTab。WorkoutTab 篩選支援六類肌群、四種器材、中英文關鍵字，提供 PR、上次組數與重量複製。`ExerciseDetailModal.tsx` 使用原生 dialog 管理焦點、Escape 與背景互動；3D 延遲載入，開啟時自動播放。休息計時使用絕對截止時間，切換分頁或背景後不累積 setInterval 誤差。

`tests/dashboard-api.test.mjs` 使用兩個會員與真實本機 D1，檢查資料隔離、跨帳號刪除、日期、SQL 參數、公式與並行組號。`tests/cors.test.mjs` 驗證正式 Worker 的跨來源請求、分區 Cookie、錯誤回應及登出撤銷。
