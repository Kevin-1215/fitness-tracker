import type {Exercise} from "./exercisesData";

/** Original coaching summaries. Research references: docs/EXERCISE-REVIEW.md. */
export const additionalExercises = [
  {
    id:"dumbbell_bench_press",name:"啞鈴平板臥推 (Dumbbell Bench Press)",category:"chest",equipment:"啞鈴",difficulty:"初階",
    primaryMuscles:["chest"],secondaryMuscles:["triceps","front_delts"],animationType:"press_horizontal",
    instructions:[
      "仰躺平凳，雙腳踩穩地面，肩胛自然向後下方穩定；兩顆啞鈴先停在胸口上方，手腕維持中立。",
      "慢慢彎曲手肘，將啞鈴放到胸部兩側；上臂與軀幹保持舒適角度，不刻意追求低於肩膀的深度。",
      "胸部帶動上臂向上推，讓啞鈴回到肩線上方；左右同步，過程維持臀部和上背接觸凳面。",
      "手肘自然伸直時穩定一下，兩顆啞鈴不需互撞；維持肩胛支撐，再開始下一次受控下放。",
    ],breathing:"下放吸氣、向上推起吐氣，腹部持續穩定。",
    commonMistakes:["避免為了增加行程而讓手肘過度低於身體或肩膀向前滑動。","不要甩起啞鈴、彈胸或在結束時把重量直接向旁邊丟下。"],
  },
  {
    id:"incline_barbell_press",name:"上斜槓鈴臥推 (Incline Barbell Bench Press)",category:"chest",equipment:"槓鈴",difficulty:"中階",
    primaryMuscles:["chest"],secondaryMuscles:["front_delts","triceps"],animationType:"press_incline",
    instructions:[
      "將凳面調至約三十度並設妥安全槓，雙腳踩穩、上背貼凳；握距略寬於肩，手腕疊在前臂上方。",
      "用可控制的速度把槓放向上胸前方，讓手肘大致位於槓下；下降深度以肩膀舒適與穩定為限。",
      "沿上胸往肩線的方向推起，兩側手臂同步伸展；保持腹部張力，避免用腰椎拱起補足行程。",
      "槓回到肩線上方時穩定停留，手肘自然伸直；確認控制住槓鈴，再慢慢開始下一次下降。",
    ],breathing:"下放時吸氣穩住軀幹，推起通過困難位置時吐氣。",
    commonMistakes:["凳角過陡或肋骨大幅翻起，會改變原本的胸推姿勢。","避免把槓放向頸部；承重較大時使用安全槓或保護者。"],
  },
  {
    id:"dumbbell_chest_fly",name:"啞鈴平板飛鳥 (Dumbbell Chest Fly)",category:"chest",equipment:"啞鈴",difficulty:"中階",
    primaryMuscles:["chest"],secondaryMuscles:["front_delts"],animationType:"fly_supine",
    instructions:[
      "仰躺平凳、肩胛穩住，啞鈴舉在胸口上方且掌心相對；手肘保留微彎，先使用較輕重量。",
      "手肘角度大致固定，讓雙臂往兩側畫弧打開；當上臂接近身體平面或胸部已有伸展感就停。",
      "想像用上臂環抱大球，沿同一弧線向胸口上方合攏；避免把動作變成大幅屈伸手肘的推舉。",
      "啞鈴在胸前上方接近時短暫停留，保留胸部張力；不互撞啞鈴，也不用肩膀聳起縮短距離。",
    ],breathing:"向外打開時吸氣，向內合攏時吐氣。",
    commonMistakes:["不要用過大重量把肩關節拉進過深位置，飛鳥不以最低點比深度。","手腕維持中立、手肘保持微彎，不要完全伸直手臂承受拉扯。"],
  },
  {
    id:"standing_cable_fly",name:"站姿滑輪夾胸 (Standing Cable Chest Fly)",category:"chest",equipment:"滑輪/機械",difficulty:"中階",
    primaryMuscles:["chest"],secondaryMuscles:["front_delts","abs"],animationType:"fly_standing",
    instructions:[
      "左右滑輪調至肩高附近，雙手各持握把並以前後站姿站穩；軀幹微前傾、肋骨與骨盆維持對齊。",
      "控制雙臂向外打開，手肘保留微彎；停在胸部能維持張力、肩膀不被往後拉扯的位置。",
      "胸部帶動上臂往胸前中線靠攏，握把沿弧線前移；身體維持穩定，避免靠踏步或腰部甩動。",
      "雙手在胸前接近時停一下，手肘角度保持一致；保持呼吸，再慢慢回到兩側打開的位置。",
    ],breathing:"打開時吸氣，夾向胸前時吐氣。",
    commonMistakes:["不要把手臂拉到身體後方過多，或在末端聳肩、向前探頭。","左右滑輪阻力保持一致，先選擇可穩定站姿的重量。"],
  },
  {
    id:"barbell_deadlift",name:"傳統槓鈴硬舉 (Conventional Barbell Deadlift)",category:"back",equipment:"槓鈴",difficulty:"進階",
    primaryMuscles:["glutes","hamstrings"],secondaryMuscles:["lower_back","quads","upper_back","forearms"],animationType:"deadlift",
    instructions:[
      "槓放在足中附近，雙腳約髖寬，折髖並彎膝握槓；背部維持自然中立，胸口與骨盆一起穩住。",
      "由站直位置先把髖部往後推，槓貼近大腿與小腿向下；槓接近膝下後再配合彎膝，控制落地。",
      "從地面推開地板，膝與髖協調伸展，讓槓貼近身體上升；軀幹角度平順改變，不猛拉起步。",
      "站直時臀部自然收緊，肩膀在髖部上方；不為了完成動作而過度後仰，再準備下一次控制下放。",
    ],breathing:"起拉前吸氣並穩住腹部，通過困難段後吐氣；每次重新設定再拉。",
    commonMistakes:["避免拱背猛拉、槓離身體太遠或髖部先單獨衝高。","從地面起槓需要合適活動度；學習時可提高槓位並降低負重。"],
  },
  {
    id:"neutral_grip_lat_pulldown",name:"窄距對握高位下拉 (Neutral-grip Lat Pulldown)",category:"back",equipment:"滑輪/機械",difficulty:"初階",
    primaryMuscles:["lats"],secondaryMuscles:["biceps","upper_back"],animationType:"pulldown_neutral",
    instructions:[
      "使用掌心相對的窄握把，調整大腿固定墊並坐穩；雙腳踩地，胸口自然抬起，軀幹保持輕微後傾。",
      "控制手肘慢慢伸展，讓握把往頭部上方回升；肩胛可以順勢上轉，但不被重量拉離座位。",
      "把手肘往身體兩側下方帶，將握把拉向上胸；維持手腕中立，不靠向後倒身來完成下拉。",
      "握把接近上胸、手肘靠近軀幹時停一下；感受背部收縮，再維持同樣路徑慢慢回放。",
    ],breathing:"回放時吸氣，下拉時吐氣。",
    commonMistakes:["不要將握把拉向腹部而造成過度後仰或腰部代償。","避免手肘硬往身後拉到肩膀前滑，採用可控制的行程。"],
  },
  {
    id:"straight_arm_pulldown",name:"滑輪直臂下拉 (Straight-arm Cable Pulldown)",category:"back",equipment:"滑輪/機械",difficulty:"中階",
    primaryMuscles:["lats"],secondaryMuscles:["triceps","abs"],animationType:"pullover_cable",
    instructions:[
      "面向高位滑輪握住直桿，雙腳站穩並輕微折髖；手肘保持小幅彎曲，軀幹與手腕先穩定。",
      "控制上臂往前上方回升，直到肩膀舒適、背闊肌仍能維持張力；避免重量把胸口拉到過度上翻。",
      "以肩關節帶動上臂向身體靠攏，將直桿沿弧線拉往大腿前方；手肘角度盡量保持一致。",
      "直桿靠近大腿時短暫穩定，感受背部張力；保持肋骨穩定，不用下壓肩膀或甩腰增加行程。",
    ],breathing:"回到前上方時吸氣，下拉靠近大腿時吐氣。",
    commonMistakes:["不要反覆屈伸手肘，否則會變成滑輪三頭下壓。","避免整個上身跟著前後搖晃，降低重量以保持肩關節控制。"],
  },
  {
    id:"inverted_row",name:"徒手反向划船 (Inverted Bodyweight Row)",category:"back",equipment:"徒手",difficulty:"中階",
    primaryMuscles:["upper_back","lats"],secondaryMuscles:["biceps","rear_delts","abs"],animationType:"inverted_row",
    instructions:[
      "把固定槓設於可控制的高度，身體移到槓下並正握；雙腳穩踩地面，從肩膀到骨盆維持直線。",
      "慢慢伸展手肘將身體放低，肩胛可順勢前移；保留腹部張力，避免臀部下垂或腰部過度拱起。",
      "把胸口拉向固定槓，手肘往斜後方移動、肩胛自然靠攏；保持頸部中立，不用下巴去碰槓。",
      "胸口接近槓時穩定停一下，身體保持整體移動；再控制手臂伸展，回到肩膀舒適的位置。",
    ],breathing:"放低身體時吸氣，向槓拉近時吐氣。",
    commonMistakes:["先確認槓架固定可靠，身體角度越平越困難，可提高槓位降低難度。","避免聳肩、仰頭或用髖部甩動來帶起身體。"],
  },
  {
    id:"goblet_squat",name:"啞鈴高腳杯深蹲 (Dumbbell Goblet Squat)",category:"legs",equipment:"啞鈴",difficulty:"初階",
    primaryMuscles:["quads","glutes"],secondaryMuscles:["abs","upper_back"],animationType:"goblet_squat",
    instructions:[
      "雙手將一顆啞鈴直立抱在胸前，雙腳約肩寬並讓腳尖自然外開；腳掌三點踩穩，先建立腹部張力。",
      "髖與膝協調彎曲，身體向兩腿之間坐下；膝蓋大致跟隨腳尖，下降至能保持背部中立的深度。",
      "用整個腳掌推地，髖膝同步伸直站起；讓啞鈴維持靠近胸前，避免胸口先塌下或臀部先抬高。",
      "回到站直時自然收緊臀部，膝蓋不需用力後撞；重新穩定呼吸與站姿，再開始下一次下蹲。",
    ],breathing:"下蹲時吸氣穩住腹部，站起時吐氣。",
    commonMistakes:["不要為了蹲得更深而讓腳跟離地、膝蓋內夾或骨盆過度捲起。","啞鈴避免離胸太遠；選擇能維持全程穩定的重量。"],
  },
  {
    id:"dumbbell_reverse_lunge",name:"啞鈴後跨弓箭步 (Dumbbell Reverse Lunge)",category:"legs",equipment:"啞鈴",difficulty:"中階",
    primaryMuscles:["quads","glutes"],secondaryMuscles:["hamstrings","abs"],animationType:"reverse_lunge",
    instructions:[
      "雙手各持啞鈴自然垂在身側，雙腳約髖寬站穩；保持胸口與骨盆朝前，先確認後方有足夠空間。",
      "其中一腳向後跨步，前後膝一起彎曲下降；前腳整個腳掌踩穩，後膝朝地面下降但不撞地。",
      "以留在前方的腿推地站起，後腳順勢回到原位；身體保持平衡，不靠後腳用力蹬跳來完成。",
      "回到站姿時先穩住重心，再開始下一次；示範先以同一側呈現，實際訓練需記得更換左右腳。",
    ],breathing:"跨步下沉時吸氣，前腿推地站起時吐氣。",
    commonMistakes:["兩腳不要踩在同一直線上；保留左右寬度能幫助穩定。","避免前膝明顯內夾、後膝撞地，或以過重啞鈴犧牲平衡。"],
  },
  {
    id:"standing_calf_raise",name:"站姿徒手提踵 (Standing Calf Raise)",category:"legs",equipment:"徒手",difficulty:"初階",
    primaryMuscles:["calves"],secondaryMuscles:["quads","glutes"],animationType:"calf_raise",
    instructions:[
      "雙腳約髖寬站穩，腳尖自然朝前，膝蓋保持柔軟但不反覆蹲起；需要時可輕扶固定物協助平衡。",
      "控制腳跟慢慢下降直到地面，感受小腿伸展；不快速落下，也不讓腳踝往內或往外倒塌。",
      "透過前腳掌往地面推，將腳跟平順抬高；保持身體垂直，動作集中在腳踝而不是借膝蓋彈跳。",
      "在可控制的最高點停一下，維持大腳趾與小腳趾根部的支撐；確認平衡後再慢慢下降。",
    ],breathing:"腳跟下降時吸氣，提起時吐氣，避免屏住呼吸維持平衡。",
    commonMistakes:["避免用彈跳取代受控的踝關節伸展，或只壓在腳掌外側。","若使用踏板增加行程，先確認踏板固定並以舒適範圍下降。"],
  },
  {
    id:"barbell_hip_thrust",name:"槓鈴臀推 (Barbell Hip Thrust)",category:"legs",equipment:"槓鈴",difficulty:"中階",
    primaryMuscles:["glutes"],secondaryMuscles:["hamstrings","abs"],animationType:"hip_thrust",
    instructions:[
      "上背靠在固定凳邊，槓鈴加軟墊放在髖摺處，雙腳踩穩；雙手穩住槓，視線自然朝前下方。",
      "控制髖部往地面下降，讓軀幹隨上背支點移動；維持肋骨下收，不以腰椎過度彎曲增加幅度。",
      "腳掌推地、臀部帶動髖部向上伸展，讓槓隨骨盆上升；膝蓋跟隨腳尖方向，避免左右晃動。",
      "軀幹與大腿接近一直線時收緊臀部停一下；不把腰部向上拱，再以控制速度回到起始位置。",
    ],breathing:"下降時吸氣，臀部推起時吐氣，頂端維持腹部穩定。",
    commonMistakes:["凳子須固定不滑動，槓鈴需加合適軟墊以減少髖部壓迫。","頂端不要過度後仰或抬下巴，調整腳距讓膝與髖舒服承重。"],
  },
  {
    id:"dumbbell_shoulder_press",name:"站姿啞鈴肩推 (Standing Dumbbell Shoulder Press)",category:"shoulders",equipment:"啞鈴",difficulty:"中階",
    primaryMuscles:["front_delts","side_delts"],secondaryMuscles:["triceps","abs"],animationType:"press_vertical",
    instructions:[
      "雙腳約髖寬站穩，啞鈴停在肩膀附近，手肘略朝前；肋骨與骨盆對齊，手腕維持在前臂上方。",
      "慢慢彎曲手肘將啞鈴放回肩高附近，肩胛順勢下轉；不強迫下放到手腕低於舒適的位置。",
      "雙手平順向頭頂上方推起，讓肩胛自然上轉；保持腹部張力，身體不向後倒來借力。",
      "啞鈴回到肩線上方、手肘自然伸直時短暫穩定；保持頸部輕鬆，再開始下一次下放。",
    ],breathing:"下放吸氣，上推吐氣，避免整組憋氣或腰部代償。",
    commonMistakes:["不要用腰椎大幅後仰、膝蓋彈動或聳肩硬推超出控制的重量。","肩膀若不適，可改較舒適的中立握法並縮小行程。"],
  },
  {
    id:"dumbbell_front_raise",name:"啞鈴前平舉 (Dumbbell Front Raise)",category:"shoulders",equipment:"啞鈴",difficulty:"初階",
    primaryMuscles:["front_delts"],secondaryMuscles:["side_delts","abs"],animationType:"front_raise",
    instructions:[
      "雙腳站穩，兩顆啞鈴置於大腿前方，手肘微彎、手腕中立；先用輕重量建立肩部控制。",
      "保持手肘角度，將啞鈴慢慢放回大腿前方；不要在接近底部時突然放鬆或用啞鈴撞擊大腿。",
      "由肩關節帶動上臂向前抬，將啞鈴舉至肩高附近；身體保持穩定，不用髖部或膝蓋甩起。",
      "啞鈴到肩高時稍作停留，保持肩膀遠離耳朵；感受前肩張力，再沿相同弧線緩慢放下。",
    ],breathing:"放下吸氣，向前抬起吐氣。",
    commonMistakes:["不要為了舉得更高而聳肩或把重量抬到無法控制的頭頂位置。","前肩已因推舉疲勞時減量，避免用下背甩動完成最後幾下。"],
  },
  {
    id:"bent_over_reverse_fly",name:"俯身啞鈴反向飛鳥 (Bent-over Dumbbell Reverse Fly)",category:"shoulders",equipment:"啞鈴",difficulty:"中階",
    primaryMuscles:["rear_delts"],secondaryMuscles:["upper_back","lower_back"],animationType:"reverse_fly",
    instructions:[
      "膝蓋微彎並折髖俯身，背部保持自然中立；啞鈴垂在胸口下方，手肘保留微彎，視線看向地面。",
      "控制雙臂回到胸口下方，維持原本的俯身角度；不在底部甩動，也不靠腰部彎曲延長行程。",
      "由上臂往兩側後方帶動啞鈴，像張開翅膀般抬起；肩胛可自然靠攏，手肘角度大致不變。",
      "上臂接近身體平面時短暫停留，保持頸部與肩膀放鬆；不硬拉到身後，再受控回到起點。",
    ],breathing:"雙臂回落時吸氣，向兩側抬起時吐氣。",
    commonMistakes:["避免把飛鳥變成手肘大幅彎曲的划船，或抬頭造成頸部壓力。","如果無法穩定俯身，可先減重，或改用有胸墊支撐的版本。"],
  },
  {
    id:"machine_shoulder_press",name:"坐姿機械肩推 (Seated Machine Shoulder Press)",category:"shoulders",equipment:"滑輪/機械",difficulty:"初階",
    primaryMuscles:["front_delts","side_delts"],secondaryMuscles:["triceps"],animationType:"press_vertical_seated",
    instructions:[
      "調整座椅讓握把約在肩高附近，背部貼好靠墊、雙腳踩穩；選擇肩膀舒適的握法並維持手腕中立。",
      "沿機械軌跡控制握把下降，手肘慢慢彎曲；停在肩膀舒適且不需抬起臀部來配合的位置。",
      "把握把平順向上推起，肩胛自然上轉，背部繼續接觸靠墊；避免肋骨大幅翻起或用腳蹬起臀部。",
      "手肘自然伸直時停一下，不撞擊關節或讓配重片猛落；確認穩定後再慢慢回到肩高附近。",
    ],breathing:"握把下降吸氣，上推時吐氣。",
    commonMistakes:["座椅高度與起始位置須合適，不硬做不符合自己肩部活動度的軌跡。","保持頭頸自然，不以拱腰、抬臀或聳肩補足推舉。"],
  },
  {
    id:"close_grip_bench_press",name:"窄握槓鈴臥推 (Close-grip Barbell Bench Press)",category:"arms",equipment:"槓鈴",difficulty:"中階",
    primaryMuscles:["triceps"],secondaryMuscles:["chest","front_delts"],animationType:"press_close",
    instructions:[
      "仰躺平凳、雙腳踩穩，肩胛向後下方穩定；雙手約肩寬握槓，避免為了窄握而讓手腕過度內折。",
      "慢慢把槓放向胸骨下段附近，手肘以舒適角度靠近軀幹；維持手腕與前臂對齊，不用槓彈胸。",
      "三頭肌與胸部協同把槓推回肩線上方，手肘平順伸展；臀部與上背保持接觸凳面，避免扭動。",
      "手肘自然伸直時短暫穩住槓鈴，維持肩胛支撐；不硬撞手肘鎖定，再開始下一次控制下放。",
    ],breathing:"下放時吸氣，上推時吐氣並維持腹部穩定。",
    commonMistakes:["窄握不代表雙手互貼，過窄握距可能增加手腕不適。","不要強迫手肘緊貼肋骨；較重組數使用安全槓或保護者。"],
  },
  {
    id:"reverse_barbell_curl",name:"反握槓鈴彎舉 (Reverse Barbell Curl)",category:"arms",equipment:"槓鈴",difficulty:"中階",
    primaryMuscles:["forearms","biceps"],secondaryMuscles:["abs"],animationType:"reverse_curl",
    instructions:[
      "雙腳站穩，以掌心向下的正握方式持槓，握距約肩寬；上臂自然靠近身側，手腕維持平直。",
      "慢慢伸展手肘把槓放回大腿前方，持續穩住手腕；不要在最低點突然放鬆或讓槓拉扯手肘。",
      "保持上臂位置大致固定，以屈肘帶動槓向上；使用比一般彎舉較輕的重量，避免肩膀向前抬。",
      "在不需聳肩的高度停一下，感受前臂與屈肘肌群張力；保持手腕中立，再受控放回起點。",
    ],breathing:"放下吸氣，彎舉時吐氣。",
    commonMistakes:["避免手腕向後折或用拱腰、甩髖把槓拉起。","前臂或手肘不適時降低負重與行程，不以疼痛換取更多次數。"],
  },
  {
    id:"overhead_dumbbell_extension",name:"雙手啞鈴過頭三頭伸展 (Two-hand Overhead Triceps Extension)",category:"arms",equipment:"啞鈴",difficulty:"中階",
    primaryMuscles:["triceps"],secondaryMuscles:["abs","front_delts"],animationType:"overhead_extension",
    instructions:[
      "雙手穩定托握同一顆啞鈴並舉過頭，雙腳站穩；上臂朝上、肋骨不翻起，確認握法安全不滑動。",
      "上臂位置大致固定，慢慢彎曲手肘讓啞鈴往頭後方下降；停在肩與手肘舒適、可控制的位置。",
      "以三頭肌帶動手肘伸展，把啞鈴舉回頭頂上方；不要靠腰部後仰或肩膀大幅移動來補行程。",
      "手肘自然伸直時稍作停留，腹部保持張力；確認啞鈴與上臂穩定後，再慢慢開始下一次下降。",
    ],breathing:"啞鈴下降時吸氣，向上伸展時吐氣。",
    commonMistakes:["不要強行把手肘夾到最窄，肩部不適可改用滑輪下壓版本。","啞鈴經過頭部附近，務必使用能穩定控制與安全握持的重量。"],
  },
  {
    id:"alternating_dumbbell_curl",name:"交替啞鈴彎舉 (Alternating Dumbbell Biceps Curl)",category:"arms",equipment:"啞鈴",difficulty:"初階",
    primaryMuscles:["biceps"],secondaryMuscles:["forearms","abs"],animationType:"alternate_curl",
    instructions:[
      "雙腳約髖寬站穩、雙手各持一顆啞鈴，上臂自然靠身側；肩膀放鬆，手腕保持與前臂對齊。",
      "將已彎舉的那一側慢慢放回身側，保持上臂位置；另一側依序進入彎舉，讓交替節奏平順。",
      "用屈肘帶動其中一側啞鈴向肩前靠近，掌心自然朝上；軀幹維持正面，不跟著啞鈴左右轉動。",
      "彎舉側在不需抬肩的高度停一下，再受控放下並換邊；左右採同樣重量與可控制的行程。",
    ],breathing:"彎舉的一側發力時吐氣，放下時吸氣，呼吸保持連續。",
    commonMistakes:["避免左右扭腰、聳肩或把上臂往前甩來抬高啞鈴。","左右各一次才完成一輪交替，紀錄次數時請維持自己的計數方式一致。"],
  },
  {
    id:"dead_bug",name:"死蟲式 (Dead Bug)",category:"core",equipment:"徒手",difficulty:"初階",
    primaryMuscles:["abs"],secondaryMuscles:["obliques"],animationType:"dead_bug",
    instructions:[
      "仰躺地面，雙手指向天花板，髖與膝彎曲抬起小腿；先輕吐氣穩住腹部，讓腰背位置保持穩定。",
      "將對側手與腳慢慢往遠處延伸，手臂朝頭後方、腿朝地面前方；行程以腰背不離開控制為限。",
      "維持肋骨與骨盆穩定，把伸出的手與腳慢慢收回原位；不靠快速彈回或抬頭來完成回收。",
      "回到雙手朝上、髖膝彎曲的位置時停一下，再更換對側；保持肩膀放鬆與連續呼吸。",
    ],breathing:"向外伸展時慢慢吐氣，收回時吸氣，避免為了穩定而長時間閉氣。",
    commonMistakes:["腰背若明顯拱起，縮短手腳伸出的距離，或先只移動單一肢體。","不要比伸得多低或移得多快，重點是軀幹位置維持穩定。"],
  },
  {
    id:"bird_dog",name:"鳥狗式 (Bird Dog)",category:"core",equipment:"徒手",difficulty:"初階",
    primaryMuscles:["abs","obliques"],secondaryMuscles:["glutes","lower_back","front_delts"],animationType:"bird_dog",
    instructions:[
      "四足跪姿，手掌在肩膀下方、膝蓋在髖部下方；背部自然中立，視線看地面，先穩住呼吸與腹部。",
      "對側手與腳沿地面方向慢慢伸遠，抬到能保持骨盆水平的位置；不要為了抬高腿而拱起腰部。",
      "維持軀幹不旋轉，控制伸出的手腳收回四足跪姿；支撐手臂繼續推地，不讓肩膀塌下。",
      "伸直時可以短暫停留，感受腹部與臀部維持平衡；收回後換另一側，以同樣慢速重複。",
    ],breathing:"伸展時緩慢吐氣、收回吸氣，維持自然連續的呼吸。",
    commonMistakes:["避免身體左右翻轉、抬頭或把腿抬得高於可以維持中立的位置。","示範先呈現一組對側肢體，實際訓練需更換左右兩邊。"],
  },
  {
    id:"hanging_knee_raise",name:"懸垂屈膝抬腿 (Hanging Knee Raise)",category:"core",equipment:"徒手",difficulty:"進階",
    primaryMuscles:["abs"],secondaryMuscles:["obliques","forearms","lats"],animationType:"hanging_knee_raise",
    instructions:[
      "握住固定單槓並懸垂，肩膀保持可控制的支撐、身體先停止擺動；雙腿自然垂下，手肘不需反覆彎舉。",
      "慢慢把膝蓋放回垂下位置，控制骨盆回正；不要突然放腿，也不讓身體被下放的慣性帶著前後盪動。",
      "吐氣時以腹部帶動骨盆輕微後捲，將彎曲的膝蓋抬向身前；上半身保持穩定，不靠踢腿借力。",
      "在不擺盪的最高控制點短暫停留，感受腹部張力；維持握力與肩膀支撐，再慢慢放回起點。",
    ],breathing:"抬膝並輕收骨盆時吐氣，放下時吸氣。",
    commonMistakes:["不要只用甩腿或前後擺盪增加高度，先從較小行程開始。","若握力或肩部支撐不足，可先練地面死蟲式或改有支撐的器械版本。"],
  },
  {
    id:"standing_pallof_press",name:"站姿滑輪抗旋轉推 (Standing Cable Pallof Press)",category:"core",equipment:"滑輪/機械",difficulty:"中階",
    primaryMuscles:["obliques","abs"],secondaryMuscles:["glutes","front_delts"],animationType:"pallof_press",
    instructions:[
      "身體側對約胸高的滑輪，雙腳約肩寬、雙手把握把收在胸前；調整距離讓纜線有張力但站姿仍穩定。",
      "保持胸口與骨盆朝前，讓握把慢慢回到胸前；不因滑輪拉力而轉向器械，也不突然放鬆手臂。",
      "雙手向正前方平順推出，讓腹部抵抗從側面來的旋轉拉力；膝蓋柔軟、肩膀不聳起，身體不偏移。",
      "手臂接近伸直時短暫停留，繼續自然呼吸；確認軀幹穩定再收回，完成一側後更換方向。",
    ],breathing:"向前推出時吐氣，回到胸前吸氣；停留時仍維持自然呼吸。",
    commonMistakes:["不要把抗旋轉練成轉體，或側彎身體去抵銷過大的負重。","示範纜線由單側拉住握把，實際訓練兩側都要做相同的控制次數。"],
  },
] as const satisfies readonly Exercise[];
