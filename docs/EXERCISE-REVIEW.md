# 動作教學查核與 3D 狀態（2026-11-27）

目前 50 個動作都有來源、影片入口、原創中文四步說明、呼吸、常見錯誤，及新增的支撐／握法、行程終點、簡化版本。動作代碼與歷史紀錄不改。

## 為何停用舊 3D 動作

舊模型用手腳端點解兩節骨架，沒有完整限制肩關節、前臂旋轉、肘膝鉸鏈方向及器材接觸。數值有限、肢段長度固定、鏡頭裝得下，都不能證明人體做得出來。先前 3D 截圖檢查和數值測試不能作為動作正確性的證明。

舊 motionRig 路徑仍不對使用者開放。全部 50 個動作均已改用新版骨架；其餘 38 項於本次補齊。獨立的肌群總覽頁籤及模型內切換已移除，保留動作中的肌群顏色。

## 新骨架與操作

清單見 `lib/motionCatalog.ts`，與 50 項動作庫逐項對應。共同關節工具位於 `lib/jointKinematics.ts`，新增姿態及場景位於 `lib/extendedMotion.ts`，器材連動位於 `components/anatomy/ControlledApparatus.tsx`。

肘膝沿局部鉸鏈軸旋轉，前臂旋前／旋後另行處理，肢段長度固定。依動作固定腳掌、手掌、單槓、膝或上背接觸；後跨、提踵與腿推則分別處理跨步、前掌支點及踏板座標。引體向上固定手與槓、移動身體；鳥狗式與死蟲式伸出對側手腳；捲腹與側彎使用胸廓相對骨盆旋轉；棒式為等長保持。槓鈴固定握距，纜線連到握點，腿推的腳與踏板沿同一導軌移動。機械使用通用結構示意，並非重建影片中每個品牌的機型。這是程式化人體示意，不是動作捕捉或個人姿勢評估。

上斜凳以來源示範約 45° 建立。參照 [NASM 臥推](https://www.nasm.org/resource-center/exercise-library/barbell-bench-press)、[NASM 羅馬尼亞硬舉](https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift)、[NASM 二頭彎舉](https://www.nasm.org/resource-center/exercise-library/barbell-bicep-curl)、[ACE 側平舉](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/) 及各動作既有來源。深蹲膝蓋朝腳尖方向的設計另參考 [NSCA 背蹲評估論文](https://pmc.ncbi.nlm.nih.gov/articles/PMC4262933/)，沒有把「膝蓋不可超過腳尖」設成限制。

預設影片，切換 3D 後預設暫停在中段，可選起始／中段／底點或收縮位／回程、拖曳進度、慢速循環、換側、顯示關節及手部軌跡、上半身放大與四視角。棒式不顯示速度或姿勢進度。對照觀看在桌面並排、手機上下排列；影片與 3D 分別控制，沒有自動同步。

測試逐項取樣 101 個姿勢，檢查骨長、鉸鏈方向、設定角度範圍與連續性；另渲染 50 項各三個姿勢，檢查實際節點、握點、網格頂點有無穿地，以及四視角／兩種畫面比例。另驗證固定手支撐、對側手腳、提踵支點、踏板局部座標與等長姿勢。瀏覽器對新增 38 項保存起始與關鍵姿勢，共 84 張截圖（含修正後的四項複查），逐組比對；另抽查手機、換側、影片對照及模式移除。測試檢查程式與畫面一致性，尚未經真人教練審核，不等於生物力學認證；圖中角度不應作為個人目標角度。

新增查核除下表既有來源，另參照 [ACE 凳上單臂划船](https://www.acefitness.org/resources/everyone/exercise-library/126/single-arm-row/)、[NASM 下拉握法](https://www.nasm.org/resource-center/blog/training/the-biomechanics-of-the-lat-pulldown-muscles-grip-and-form)、[ACE 三頭下壓](https://www.acefitness.org/resources/everyone/exercise-library/185/triceps-pushdowns/)、[ACE 過頭三頭伸展](https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/)、[Bret Contreras 臀推](https://bretcontreras.com/how-to-hip-thrust/)、[NASM 死蟲式](https://www.nasm.org/resource-center/exercise-library/dead-bug) 及 [鳥狗式](https://www.nasm.org/resource-center/exercise-library/bird-dog)。姿態數值是本專案將文字與來源示範轉成的工程設計；本次未逐幀觀看全部影片。

## 來源與查核範圍

逐項讀取 NASM 與 Muscle & Strength 的官方目錄、教學步驟與嵌入影片連結；提踵使用 Mayo Clinic 影片及文字。49 個 YouTube／Vimeo 連結的官方 oEmbed 回應均為 HTTP 200；另 1 個連到 Mayo 官方影片頁。這是影片存在性檢查，不能保證所有地區、裝置與未來時間均允許播放。

另以瀏覽器抽查六類實際影片畫面：上斜啞鈴臥推、槓鈴深蹲、啞鈴羅馬尼亞硬舉、正握下拉、地面派克伏地挺身、前臂平板支撐。沒有聲稱逐幀看完全部 50 支影片，亦未由真人教練審核合成 3D。影片由原平台按需播放，未下載或重製；文字為本專案中文摘要。

站內實測：YouTube privacy-enhanced 播放器可載入。Muscle & Strength 的 Vimeo 播放器在本網站會拒絕跨網域內嵌，但在原作者教學頁正常顯示播放器；因此 Vimeo 項目改為開啟對應的原作者教學頁，不顯示失敗的內嵌播放器。循環播放只對站內 YouTube 播放器提供。

來源若非完全相同變式，會顯示具體差異：單臂划船的凳面支撐、寬／窄距對握划船、壺鈴／啞鈴杯式深蹲、交替槌式彎舉、單手側彎、窄距／菱形伏地挺身、徒手／啞鈴提踵等。派克伏地挺身已改選腳在地面的影片，未沿用腳墊高影片。對握下拉選 V 把影片，不使用正握窄桿影片。

## 逐項參考

| 動作 | 教學來源 | 影片 | 版本差異 |
|---|---|---|---|
| 槓鈴平板臥推 | [NASM](https://www.nasm.org/resource-center/exercise-library/barbell-bench-press) | [觀看](https://www.youtube.com/watch?v=CayG6UYqL8g) | 依頁面列出的器材與姿勢檢查點練習。 |
| 上斜啞鈴臥推 | [NASM](https://www.nasm.org/resource-center/exercise-library/two-arm-incline-dumbbell-chest-press) | [觀看](https://www.youtube.com/watch?v=JKnpHchOWPU) | 影片採約 45° 上斜；先以能穩住上背、肩部舒服的角度練習，調整凳角時重新減重。 |
| 坐姿機械胸推 | [NASM](https://www.nasm.org/resource-center/exercise-library/chest-press-machine) | [觀看](https://www.youtube.com/watch?v=lRo9zZ7EwpM) | 依頁面列出的器材與姿勢檢查點練習。 |
| 伏地挺身 | [NASM](https://www.nasm.org/resource-center/exercise-library/push-up) | [觀看](https://www.youtube.com/watch?v=WDIpL0pjun0) | 依頁面列出的器材與姿勢檢查點練習。 |
| 槓鈴俯身划船 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/bent-over-barbell-row.html) | [觀看](https://www.youtube.com/watch?v=paCfxhgW6bI) | 依頁面列出的器材與姿勢檢查點練習。 |
| 單臂啞鈴划船 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html) | [觀看](https://www.youtube.com/watch?v=YZgVEy6cmaY) | 來源影片為站姿單臂划船；本頁採另一手與同側膝支撐平凳的版本。支撐方式不同，不要把影片的懸空手姿勢套到凳上。 |
| 滑輪高位下拉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/lat-pull-down.html) | [觀看](https://www.youtube.com/watch?v=iKrKgWR9wbY) | 依頁面列出的器材與姿勢檢查點練習。 |
| 正握引體向上 | [NASM](https://www.nasm.org/resource-center/exercise-library/pull-up) | [觀看](https://www.youtube.com/watch?v=9yVGh3XbJ34) | 依頁面列出的器材與姿勢檢查點練習。 |
| 槓鈴背蹲 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/squat.html) | [觀看](https://www.youtube.com/watch?v=R2dMsNhN3DE) | 依頁面列出的器材與姿勢檢查點練習。 |
| 啞鈴羅馬尼亞硬舉 | [NASM](https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift) | [觀看](https://www.youtube.com/watch?v=V8Hdl1FiNt4) | 依頁面列出的器材與姿勢檢查點練習。 |
| 機械腿推 | [NASM](https://www.nasm.org/resource-center/exercise-library/leg-press) | [觀看](https://www.youtube.com/watch?v=cDGOn-yfKJA) | 依頁面列出的器材與姿勢檢查點練習。 |
| 徒手臀橋 | [NASM](https://www.nasm.org/resource-center/exercise-library/floor-bridge) | [觀看](https://www.youtube.com/watch?v=Z3cY3d3BBo4) | 依頁面列出的器材與姿勢檢查點練習。 |
| 站姿槓鈴肩推 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/military-press.html) | [觀看](https://www.youtube.com/watch?v=j7ULT6dznNc) | 依頁面列出的器材與姿勢檢查點練習。 |
| 啞鈴側平舉 | [NASM](https://www.youtube.com/watch?v=XPPfnSEATJA) | [觀看](https://www.youtube.com/watch?v=XPPfnSEATJA) | 依頁面列出的器材與姿勢檢查點練習。 |
| 滑輪繩索面拉 | [NASM](https://www.nasm.org/resource-center/exercise-library/face-pull) | [觀看](https://www.youtube.com/watch?v=eTCBSFlCJ_s) | 依頁面列出的器材與姿勢檢查點練習。 |
| 折髖伏地肩推 | [NASM](https://www.youtube.com/watch?v=XckEEwa1BPI) | [觀看](https://www.youtube.com/watch?v=XckEEwa1BPI) | 依頁面列出的器材與姿勢檢查點練習。 |
| 槓鈴二頭彎舉 | [NASM](https://www.nasm.org/resource-center/exercise-library/barbell-bicep-curl) | [觀看](https://www.youtube.com/watch?v=pQfJR-sSIvA) | 依頁面列出的器材與姿勢檢查點練習。 |
| 啞鈴槌式彎舉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/alternate-standing-hammer-curl.html) | [觀看](https://player.vimeo.com/video/756794147) | 影片採左右交替；保持掌心相對。每側做相同次數，一側完成回放後再換側。 |
| 滑輪三頭下壓 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/tricep-extension.html) | [觀看](https://www.youtube.com/watch?v=mpZ9VRisAyw) | 依頁面列出的器材與姿勢檢查點練習。 |
| 窄距伏地挺身 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/close-grip-push-up.html) | [觀看](https://player.vimeo.com/video/756784503?h=8b3ba1decc) | 來源為窄距伏地挺身；手掌可接近菱形，但不必強迫拇指與食指相碰。手腕舒服、手肘不外翻優先。 |
| 跪姿槓鈴滾輪 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/abdominal-barbell-rollouts.html) | [觀看](https://player.vimeo.com/video/877885260) | 依頁面列出的器材與姿勢檢查點練習。 |
| 單側啞鈴側屈 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/dumbbell-side-bends.html) | [觀看](https://player.vimeo.com/video/877885243) | 本頁採單手持鈴；影片示範可見雙手持鈴。練習時只保留一側負重，骨盆固定，小幅側彎後回到直立。 |
| 跪姿滑輪捲腹 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/cable-crunch.html) | [觀看](https://player.vimeo.com/video/760008287) | 依頁面列出的器材與姿勢檢查點練習。 |
| 前臂棒式 | [NASM](https://www.nasm.org/resource-center/exercise-library/plank) | [觀看](https://www.youtube.com/watch?v=mwlp75MS6Rg) | 依頁面列出的器材與姿勢檢查點練習。 |
| 反手高位下拉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/reverse-grip-lat-pull-down.html) | [觀看](https://www.youtube.com/watch?v=8DAFwftgZHQ) | 依頁面列出的器材與姿勢檢查點練習。 |
| 坐姿寬距對握划船 | [NASM](https://www.nasm.org/resource-center/exercise-library/seated-machine-row-close-grip) | [觀看](https://www.youtube.com/watch?v=k0cTJCfxa0Y) | 來源為窄距對握划船；本頁為寬距對握。握把較寬時手肘往斜後方移動，終點以肩部舒服為準，不強拉到身後。 |
| 啞鈴平板臥推 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/dumbbell-bench-press.html) | [觀看](https://www.youtube.com/watch?v=dGqI0Z5ul4k) | 依頁面列出的器材與姿勢檢查點練習。 |
| 上斜槓鈴臥推 | [NASM](https://www.nasm.org/resource-center/exercise-library/incline-barbell-bench-press) | [觀看](https://www.youtube.com/watch?v=BjGLs6KGWUc) | 影片採約 45° 上斜；槓下放至上胸前方。先設好安全槓，再開始出槓。 |
| 啞鈴平板飛鳥 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/dumbbell-flys.html) | [觀看](https://www.youtube.com/watch?v=-lcbvOddoi8) | 依頁面列出的器材與姿勢檢查點練習。 |
| 站姿滑輪夾胸 | [NASM](https://www.nasm.org/resource-center/exercise-library) | [觀看](https://www.youtube.com/watch?v=XNf6TBErGys) | 依頁面列出的器材與姿勢檢查點練習。 |
| 傳統槓鈴硬舉 | [NASM](https://www.nasm.org/resource-center/exercise-library/barbell-deadlift) | [觀看](https://www.youtube.com/watch?v=Z6gcRfPNcZo) | 依頁面列出的器材與姿勢檢查點練習。 |
| 窄距對握高位下拉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/v-bar-pull-down) | [觀看](https://www.youtube.com/watch?v=7wEpfpKAiQ0) | 依頁面列出的器材與姿勢檢查點練習。 |
| 滑輪直臂下拉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/straight-arm-lat-pull-down.html) | [觀看](https://www.youtube.com/watch?v=gDtXrJWPdlY) | 依頁面列出的器材與姿勢檢查點練習。 |
| 徒手反向划船 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/high-inverted-row.html) | [觀看](https://player.vimeo.com/video/756788811?h=89d69b02a9) | 依頁面列出的器材與姿勢檢查點練習。 |
| 啞鈴高腳杯深蹲 | [NASM](https://www.nasm.org/resource-center/exercise-library/goblet-squat) | [觀看](https://www.youtube.com/watch?v=nfX7IFK9UNI) | 來源示範可能使用壺鈴；本頁用一顆啞鈴，雙手托住上端，保持重量貼近胸前。 |
| 啞鈴後跨弓箭步 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/dumbbell-rear-lunge.html) | [觀看](https://www.youtube.com/watch?v=Ix9QZ3Pnneo) | 依頁面列出的器材與姿勢檢查點練習。 |
| 站姿徒手提踵 | [Mayo Clinic](https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/calf-raise/vid-20084681) | [觀看](https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/calf-raise/vid-20084681) | 來源為啞鈴提踵影片。本頁先做徒手、腳跟落到平地的版本；省略啞鈴，需要時扶固定物，不直接照做額外負重。 |
| 槓鈴臀推 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/barbell-hip-thrust) | [觀看](https://www.youtube.com/watch?v=lAnqN0J_p5A) | 依頁面列出的器材與姿勢檢查點練習。 |
| 站姿啞鈴肩推 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/standing-dumbbell-press.html) | [觀看](https://player.vimeo.com/video/760002177) | 依頁面列出的器材與姿勢檢查點練習。 |
| 啞鈴前平舉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/dumbbell-front-raise.html) | [觀看](https://player.vimeo.com/video/760002236) | 依頁面列出的器材與姿勢檢查點練習。 |
| 俯身啞鈴反向飛鳥 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html) | [觀看](https://www.youtube.com/watch?v=Fgz_FdzDukE) | 依頁面列出的器材與姿勢檢查點練習。 |
| 坐姿機械肩推 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/machine-shoulder-press) | [觀看](https://www.youtube.com/watch?v=fj_VAk1jfZ8) | 依頁面列出的器材與姿勢檢查點練習。 |
| 窄握槓鈴臥推 | [NASM](https://www.nasm.org/resource-center/exercise-library/close-grip-bench-press) | [觀看](https://www.youtube.com/watch?v=LJeqLAmJLfs) | 依頁面列出的器材與姿勢檢查點練習。 |
| 反握槓鈴彎舉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/reverse-barbell-curl.html) | [觀看](https://player.vimeo.com/video/760002600) | 依頁面列出的器材與姿勢檢查點練習。 |
| 雙手啞鈴過頭三頭伸展 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/two-arm-standing-dumbbell-extension.html) | [觀看](https://www.youtube.com/watch?v=VjmgzEmODnI) | 依頁面列出的器材與姿勢檢查點練習。 |
| 交替啞鈴彎舉 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/alternating-standing-dumbbell-curl.html) | [觀看](https://player.vimeo.com/video/756794096) | 影片起始掌心已向前；也可由中立握逐漸旋至掌心向上。一次只動一側，另一側保持穩定。 |
| 死蟲式 | [NASM](https://www.nasm.org/resource-center/exercise-library/dead-bug) | [觀看](https://www.youtube.com/watch?v=bxn9FBrt4-A) | 依頁面列出的器材與姿勢檢查點練習。 |
| 鳥狗式 | [NASM](https://www.nasm.org/resource-center/exercise-library/bird-dog) | [觀看](https://www.youtube.com/watch?v=ZdAHe9_HeEw) | 依頁面列出的器材與姿勢檢查點練習。 |
| 懸垂屈膝抬腿 | [Muscle & Strength](https://www.muscleandstrength.com/exercises/hanging-knee-raise.html) | [觀看](https://player.vimeo.com/video/1082967622) | 依頁面列出的器材與姿勢檢查點練習。 |
| 站姿滑輪抗旋轉推 | [NASM](https://www.youtube.com/watch?v=f3R99GoYvCs) | [觀看](https://www.youtube.com/watch?v=f3R99GoYvCs) | 依頁面列出的器材與姿勢檢查點練習。 |

## 食物與熱量

大／小乞丐超人由使用者提供熱量及蛋白質。蛋餅採國健署《健康生活動起來手冊》原味 117 g 的表列值：261 kcal、P11／C34／F9。拿鐵採台灣麥當勞金選熱那堤約 12 oz：123.7 kcal（記錄取124）、P6.4／C9.9／F6.5。兩者實際油量、奶量、醬料、加糖及份量有變動時需修改。連結存於 foodsData。未知碳水與脂肪用 null 回傳，以 ≥ 顯示只加總已知值；不從蛋白質與熱量反推另外兩項。
