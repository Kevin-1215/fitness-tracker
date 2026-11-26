# FORM｜重訓與飲食熱量追蹤

已完成會員註冊／登入、D1 個人設定與訓練／飲食 API、50 個動作的來源影片與中文教學、互動 3D 肌群，以及完整的響應式儀表板。依本次指定，正式版使用 GitHub Pages 前端＋Cloudflare Worker API，D1 為唯一資料庫；也保留整站部署 Cloudflare Pages 的設定。

- [儀表板與 API 欄位、公式及資料隔離](docs/API.md)
- [GitHub Pages＋Cloudflare API 部署、CORS 與跨站 Cookie](docs/GITHUB-PAGES.md)

`app/dashboard/page.tsx` 是 React 頁面入口，由 `src/main.tsx` 載入。`components/dashboard/` 包含會員畫面、動作庫與組數、休息計時器、身體設定與飲食表單；`components/ExerciseDetailModal.tsx` 整合實人影片、中文檢查點、練習組數與 3D 肌群總覽。3D 不下載模型；影片由原作者平台載入，不轉存影片。食物預設不呼叫外部食品 API。

新版檢查與新增內容見 [3D 檢查紀錄](docs/EXERCISE-REVIEW.md)。

## 動作教學與 3D 肌群

動作百科共 50 項，原有代碼保持不變。

- `lib/exerciseSources.ts`：每一動作對應 NASM、Muscle & Strength 或 Mayo Clinic 的來源及影片，版本差異會顯示在播放器旁。
- `lib/exerciseCoaching.ts`：逐項中文握法／支撐、行程終點、簡化版本、節奏與每側提示。
- `components/ExerciseDetailModal.tsx`：預設實人影片，外部播放器按需載入；無法內嵌時保留原影片與教學來源連結。
- `components/ExercisePractice.tsx`：可調組數、次數／秒數、每側計數與 60／90／120 秒休息倒數。完成按鈕由使用者確認，不自動偵測次數，也不自動新增重量紀錄。

舊 IK 動作僅約束手腳端點，無法證明關節轉動與器材握法正確，因此正式版已停用合成動作與播放／進度控制。`MuscleViewer3D` 強制使用中立站姿的肌群總覽，即使舊呼叫者傳入 `isPlayingAnimation=true` 也不播放。保留正／側／背／重置、肌群點選、主橘紅／協同琥珀黃、透視、縮放與放大。肌群色彩不代表出力比例。

尚未完成具人體關節限制的 3D 動作重建；實際跟練請使用實人影片與中文步驟。可見的版本差異不可忽略，例如窄握來源不等於寬握、負重提踵影片不等於本頁徒手版本。

## 常見食物

24 種份量捷徑，包含大乞丐超人 450 kcal／25 g 蛋白質、小乞丐超人 300 kcal／15 g、原味蛋餅 117 g 為 261 kcal／11 g、熱拿鐵約 12 oz 為 124 kcal／6.4 g（台灣麥當勞金選熱那堤，123.7 kcal 進位）。來源與份量直接顯示於表單。

兩款自訂食物的碳水／脂肪保留未知；API 接受顯式 null，飲食紀錄顯示未提供，統計以 ≥ 顯示已知量。既有資料透過 `migrations/0002_partial_nutrition.sql` 加入 known 欄位，不重建資料表、不刪除紀錄。

使用原生 Edge handlers 取代已停止維護的 `@cloudflare/next-on-pages`。React＋Vite 建置到 `dist`，保留 `public/_routes.json`；不需要 Next.js 或 Node 相容旗標。`wrangler.toml` 用於同來源 Pages 版本，`wrangler.api.toml` 用於 GitHub Pages 搭配的 API Worker。兩者重用相同的 D1 handlers。

## 檔案

- `wrangler.toml`：Pages 與 D1 綁定範本。
- `schema.sql`：四個業務資料表，另加 `auth_sessions`、`auth_rate_limits`。
- `lib/env.ts`：綁定與 Function Context 型別。
- `lib/auth.ts`：PBKDF2、JWT、Cookie、來源檢查、輸入驗證、限流與會員身分讀取。
- `functions/api/auth/*.ts`：四個會員 API。
- `functions/api/[[path]].ts`：未知 API 與錯誤 HTTP 方法的 JSON 回應。

## API

| 方法 | 路徑 | JSON 內容 | 成功回應 |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "email", "password", "display_name" }` | 201 `{ "user": { "id", "email", "display_name", "created_at" } }` |
| POST | `/api/auth/login` | `{ "email", "password" }` | 200 `{ "user": ... }` |
| POST | `/api/auth/logout` | 不需要 body | 200 `{ "ok": true }` |
| GET | `/api/auth/me` | 不需要 body | 200 `{ "user": ... }`，未登入為 401 |

寫入 API 必須帶相同來源的 `Origin`。註冊、登入還需要 `Content-Type: application/json`。瀏覽器 `fetch` 同來源操作會自動帶 Origin；從 curl 測試時請自行指定。

密碼至少 12 個字元，上限 256 UTF-8 位元組；不修剪、正規化或截斷。Email 去除前後空白、轉小寫，資料庫也使用 NOCASE UNIQUE 防止大小寫重複及並行註冊競爭。

雜湊使用 Web Crypto PBKDF2-SHA256、100,000 次與 128-bit 隨機 salt，避免超過 Cloudflare 正式環境曾有的 100,000 次迭代上限。這是平台相容性取捨，低於 OWASP 對 PBKDF2-SHA256 的 600,000 次建議；本機 workerd 通過較高次數不能證明正式環境也支援，正式上線時需實測平台限制與 CPU 用量。沒有以單次 SHA256 代替密碼 KDF。

JWT 使用 HS256，包含並驗證 `sub`、`jti`、`iat`、`exp`、issuer、audience，效期七天。每次會員驗證也核對 D1 session，所以登出後重播原 Cookie 會得到 401。只登出目前 session，其他裝置繼續有效。HTTPS 使用 `__Host-fit_session`，設定 Secure、HttpOnly、SameSite=Lax、Path=/，不設定 Domain；本機 loopback HTTP 使用 `fit_session`。API 不回傳 Token、salt 或 password_hash。

註冊使用 D1 `batch()` 交易一次建立會員、profile 和 session。每次成功登入／註冊順便刪除過期 session 及一天以前的限流紀錄。限流採每 IP、每 15 分鐘固定視窗：註冊 5 次、登入 20 次；無 KV、Redis 或外部服務。這是基本限流，不能單獨阻擋分散式暴力破解。未實作 Email 驗證、忘記密碼與 MFA。

## 安裝與驗證

Node.js 22.13+，已附 pnpm lockfile。`pnpm-workspace.yaml` 只允許 esbuild 與 workerd 必要的安裝腳本。

```powershell
pnpm install
pnpm run check
pnpm test
pnpm run test:dashboard
pnpm run test:cors
pnpm run test:muscles
pnpm run test:guides
pnpm run build
pnpm run test:routing
```

測試使用短暫的本機 workerd／D1，不會連線或寫入正式 D1。這只是開發與驗證工具，正式部署沒有本機資料庫依賴。

## Cloudflare 設定

以下保留整站 Cloudflare Pages 的替代部署方式。GitHub Pages 正式部署請見上方部署文件。新帳號須建立自己的 D1，並把 database_id 填入設定；現有專案使用獨立的 fitness-tracker-db。

```powershell
pnpm exec wrangler login
pnpm exec wrangler d1 create fitness-tracker-db
```

套用遠端 Schema，建立 Pages 專案並設定 secret：

```powershell
pnpm run db:init
pnpm exec wrangler pages project create fitness-tracker --production-branch main
node -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex'))"
pnpm exec wrangler pages secret put JWT_SECRET --project-name fitness-tracker
pnpm run pages:deploy
```

上面 `node` 指令產生的隨機值只用來貼到 secret 輸入提示；請勿提交到原始碼。先執行 `pnpm run build` 產生前端，再部署 `dist`。

Cloudflare Pages Git 整合使用 `pnpm run build`，輸出資料夾設 `dist`，專案根目錄保留 `functions/`。此建置也會驗證 Functions router。

Production、Preview 要使用不同 D1 與不同 JWT_SECRET。`wrangler.toml` 有 Preview 設定範本，啟用分支預覽前先填入獨立資料庫；請勿讓預覽程式碼存取正式會員資料。

## 本機開發

```powershell
Copy-Item .dev.vars.example .dev.vars
```

把新的隨機 JWT_SECRET 填進 `.dev.vars`（不得留空），然後：

```powershell
pnpm exec wrangler d1 execute DB --local --file=schema.sql
pnpm run dev
```

如果想讓本機完全不保留 SQLite 狀態，可直接使用已提供的短暫整合測試；正式環境所有持久資料都只在遠端 D1。

## 資料隔離規則

SQLite 不會因為存在 `user_id` 外鍵就自動執行列層級授權。目前所有 profile、workout、nutrition API 都先呼叫 `requireUser(request, env)`，只使用其回傳的 `user.id`，不採信瀏覽器送來的 user_id。

```typescript
const user = await requireUser(request, env);
const result = await env.DB.prepare(
  "SELECT * FROM workout_logs WHERE user_id = ? AND log_date = ?"
).bind(user.id, requestedDate).all();
```

更新／刪除同時加上 `id = ? AND user_id = ?`，回應禁止共用 CDN 快取。`log_date` 的 Schema CHECK 驗證 YYYY-MM-DD 外觀，API 另外驗證真實日曆日期與數值範圍。前端食品數值為明示份量的可編輯估算。
