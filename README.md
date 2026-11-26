# FORM｜重訓與飲食熱量追蹤

已完成會員註冊／登入、D1 個人設定與訓練／飲食 API、50 個動作百科、互動 3D 教學，以及完整的響應式儀表板。依本次指定，正式版使用 GitHub Pages 前端＋Cloudflare Worker API，D1 為唯一資料庫；也保留整站部署 Cloudflare Pages 的設定。

- [儀表板與 API 欄位、公式及資料隔離](docs/API.md)
- [GitHub Pages＋Cloudflare API 部署、CORS 與跨站 Cookie](docs/GITHUB-PAGES.md)

`app/dashboard/page.tsx` 是 React 頁面入口，由 `src/main.tsx` 載入。`components/dashboard/` 包含會員畫面、動作庫與組數、休息計時器、身體設定與飲食表單；`components/ExerciseDetailModal.tsx` 整合放大版 3D 與四步教學。正式版不依賴外部模型或食品 API。

新版檢查與新增內容見 [3D 檢查紀錄](docs/EXERCISE-REVIEW.md)。

## Task 2：動作百科與 3D 人體

入口為 `lib/exercisesData.ts`、`components/MuscleViewer3D.tsx`，並使用 `lib/motionRig.ts` 與 `components/anatomy/` 的曲面、材質、器械和樣式模組。整合時請一併複製這些模組。六大分類至少各四個動作，每一分類皆有四種器材；包含參考圖中的反手高位下拉與坐姿寬距對握划船；本次另新增 24 個動作，總共 50 個。每個動作都有中英名稱、主要／協同肌群、難度、動畫模式、四步教學、呼吸與常見錯誤。

元件保留 `'use client'`，可在 React + Vite 或 Next.js 使用；所有幾何、肌群紋理與環境照明皆由程式產生，不下載外部 GLB、貼圖、HDR、字型或 API 資料。新版以連續截面曲線建立實體軀幹、四肢與頸部，肌群貼面順著身體表面延伸，Shader 表現肌纖維紋路，並使用 Bloom、柔光環境與地面陰影。滑輪機有機架、配重片、座墊、握桿與跟隨動作的纜線；其他動作使用對應的槓鈴、啞鈴、凳面或踏板。

主肌群橘紅、輔助肌群琥珀黃；重疊時主要肌群優先。`chest/back/legs/shoulders/arms/core` 群組名稱與細分肌群都可傳入。播放／暫停保留當前動作，肌群總覽會回到站姿；棒式維持等長支撐。正面、側面、背面與重置視角可重複點擊，重新定位鏡頭。選動作時更新 props 即可，不需要用 `key` 重建 Canvas。

新增互動：

- 拖曳進度或以鍵盤操作滑桿，停在循環中的任一姿勢；拖曳會自動暫停。
- 0.5×、0.75×、1×、1.5× 播放速度，顯示向心／離心階段。
- 點選人體肌群貼面或下方肌群按鈕，顯示中英名稱與功能說明。
- 實體人偶為預設，透視按鈕可切回未參與肌群 opacity 0.3 的模式。
- 放大檢視在網頁內展開，支援 Escape 關閉與焦點循環，不需要瀏覽器全螢幕權限。
- 直式手機版將較長的肌群說明放在場景下方，避免遮住人體。

元件有自己的範圍限定 CSS，不要求宿主先設定 Tailwind。預設不自動播放；減少動態效果的系統偏好會停用肌群呼吸燈，切換離開頁籤則暫停動畫更新。

受控播放範例：

```tsx
'use client';
import { useState } from 'react';
import MuscleViewer3D from './components/MuscleViewer3D';
import { exerciseById } from './lib/exercisesData';

export default function ExercisePreview() {
  const [playing, setPlaying] = useState(false);
  const exercise = exerciseById.get('bench_press')!;
  return <MuscleViewer3D
    exerciseName={exercise.name}
    primaryMuscles={exercise.primaryMuscles}
    secondaryMuscles={exercise.secondaryMuscles}
    animationType={exercise.animationType}
    equipment={exercise.equipment}
    isPlayingAnimation={playing}
    onPlayingAnimationChange={setPlaying}
  />;
}
```

省略 `isPlayingAnimation` 時，內建按鈕會自行管理播放；傳入這個 prop 時，請同時提供 `onPlayingAnimationChange`，否則播放按鈕會停用並提示由父元件控制。

```powershell
pnpm run test:muscles
pnpm run preview:muscles
```

本機獨立元件示範頁為 `http://127.0.0.1:4173/`；正式會員儀表板的本機入口為 `http://127.0.0.1:8788/`。3D 已整合於動作教學視窗，開啟時自動播放，關閉時卸載場景。模型用於關節與肌群分區示意，不是精密的人體生物力學模擬。

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
