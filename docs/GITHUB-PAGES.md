# GitHub Pages 前端＋Cloudflare API

正式部署採 GitHub Pages 提供 React／Vite 靜態前端，Cloudflare Worker 執行 API，D1 是唯一資料庫。`functions/api/` 保留原生 Pages Functions handlers，`worker/index.ts` 重用相同程式，加入路由及 CORS。原本整站 Cloudflare Pages 的部署方式仍可用。

- 前端：`https://kevin-1215.github.io/fitness-tracker/`
- 原始碼：`https://github.com/Kevin-1215/fitness-tracker`
- API：`https://form-fitness-api.kevin-design-lab.workers.dev`
- D1：`fitness-tracker-db`（與其他專案分開）。JWT secret 僅儲存在 Cloudflare。

GitHub Pages 不執行伺服器 API。[GitHub 官方說明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## 設定

- `wrangler.api.toml`：API 名稱、D1 綁定與唯一允許的 `FRONTEND_ORIGIN`，不可加路徑或尾端斜線。
- GitHub Repository variable `VITE_API_ORIGIN`：API 的 HTTPS origin，為公開設定，不是 secret。
- GitHub Actions 自動設定 `VITE_BASE_PATH=/<repo>/`，避免資源路徑指到 github.io 根目錄。
- `.github/workflows/pages.yml`：main push 後安裝依賴、檢查型別、執行測試，建置前端，再發布 Pages。API secret 不會交給前端或 Pages artifact。

新環境的初始化順序：

```powershell
pnpm install
pnpm exec wrangler login
pnpm exec wrangler d1 create fitness-tracker-db
# 把回傳的 UUID 填入 wrangler.api.toml 及 wrangler.toml
pnpm exec wrangler d1 execute DB --config wrangler.api.toml --remote --file=schema.sql
node scripts/set-api-secret.mjs
pnpm run api:deploy
```

`set-api-secret.mjs` 僅用於新 API 初始化：產生新的 256-bit 隨機密鑰，透過 stdin 傳給 Wrangler。對既有服務重跑會輪替密鑰並使舊 JWT 失效。日常更新只執行 `pnpm run api:deploy`。既有 Task 1 資料庫只需額外套用 `migrations/0001_workout_history_index.sql`，不要替換資料庫。

將 API 部署回傳的 URL 設為 GitHub Repository variable `VITE_API_ORIGIN`；在 Repository Settings / Pages 選 GitHub Actions。推送 main 觸發發布。Cloudflare API 的日常更新目前由本機 Wrangler 登入部署，GitHub 不儲存 Cloudflare 憑證。

## 跨來源登入

前端 fetch 使用 `credentials: include`。Worker 僅允許設定的 HTTPS 前端 origin，CORS 回覆明確 origin 與 Allow-Credentials，不使用 `*`；寫入 API 同時驗證 Origin。預檢只接受端點支援的方法與 Content-Type header。設定 FRONTEND_ORIGIN 後，HTTPS session Cookie 使用 `__Host-`、Secure、HttpOnly、SameSite=None、Partitioned；瀏覽器把 Cookie 綁定到前端的頂層網站，JWT 不進入 localStorage、JavaScript 或 URL。

分區 Cookie 需要支援 CHIPS 的瀏覽器。舊瀏覽器或嚴格封鎖所有 Cookie 的設定可能無法登入；前端會驗證 Cookie 能否讀回並顯示明確訊息。長期可將前端與 API 綁定到自己的同一主網域，以降低跨站環境的相容性限制。[MDN CHIPS 說明](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies/Partitioned_cookies)

## 本機

`.dev.vars` 只用於本機，須自行填入隨機 JWT_SECRET，檔案已忽略。`pnpm run build` 建置同來源版本；`pnpm exec wrangler d1 execute DB --local --file=schema.sql` 初始化開發 D1；`pnpm run dev` 在 127.0.0.1:8788 啟動 Pages。它不會寫入遠端 D1。測試使用短暫 D1，不保留會員。
