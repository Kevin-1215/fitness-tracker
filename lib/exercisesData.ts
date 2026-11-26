import {additionalExercises} from "./additionalExercises";

export const CATEGORIES = ["chest", "back", "legs", "shoulders", "arms", "core"] as const;
export type ExerciseCategory = (typeof CATEGORIES)[number];
export type Equipment = "槓鈴" | "啞鈴" | "滑輪/機械" | "徒手";
export type Difficulty = "初階" | "中階" | "進階";

export const MUSCLE_LABELS = {
  chest: "胸大肌", lats: "背闊肌", upper_back: "斜方肌／菱形肌", lower_back: "豎脊肌",
  front_delts: "三角肌前束", side_delts: "三角肌中束", rear_delts: "三角肌後束",
  biceps: "肱二頭肌", triceps: "肱三頭肌", forearms: "前臂肌群",
  quads: "股四頭肌", hamstrings: "腿後肌群", glutes: "臀大肌", calves: "小腿肌群",
  abs: "腹直肌", obliques: "腹斜肌",
} as const;
export type AnatomicalMuscle = keyof typeof MUSCLE_LABELS;
export type MuscleId = AnatomicalMuscle | ExerciseCategory;

export const MUSCLE_GROUPS: Readonly<Record<ExerciseCategory, readonly AnatomicalMuscle[]>> = {
  chest: ["chest"], back: ["lats", "upper_back", "lower_back"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  shoulders: ["front_delts", "side_delts", "rear_delts"],
  arms: ["biceps", "triceps", "forearms"], core: ["abs", "obliques"],
};

export function expandMuscles(muscles: readonly MuscleId[]): Set<AnatomicalMuscle> {
  const result = new Set<AnatomicalMuscle>();
  for (const muscle of muscles) {
    if (Object.prototype.hasOwnProperty.call(MUSCLE_GROUPS, muscle)) {
      for (const part of MUSCLE_GROUPS[muscle as ExerciseCategory]) result.add(part);
    } else result.add(muscle as AnatomicalMuscle);
  }
  return result;
}

export const ANIMATION_TYPES = [
  "press_horizontal", "press_incline", "press_seated", "push_up",
  "row_pull", "row_single", "pulldown", "pull_up", "squat", "hinge", "leg_press", "bridge",
  "press_vertical", "raise", "face_pull", "pike_push_up", "curl", "hammer_curl", "extension",
  "push_up_narrow", "rollout", "side_bend", "plank_crunch", "plank", "pulldown_supinated", "row_seated",
  "fly_supine", "fly_standing", "deadlift", "pulldown_neutral", "pullover_cable", "inverted_row",
  "goblet_squat", "reverse_lunge", "calf_raise", "hip_thrust", "front_raise", "reverse_fly",
  "press_vertical_seated", "press_close", "reverse_curl", "overhead_extension", "alternate_curl",
  "dead_bug", "bird_dog", "hanging_knee_raise", "pallof_press",
] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly category: ExerciseCategory;
  readonly equipment: Equipment;
  readonly difficulty: Difficulty;
  readonly primaryMuscles: readonly MuscleId[];
  readonly secondaryMuscles: readonly MuscleId[];
  readonly animationType: AnimationType;
  /** 依序為：預備、離心、向心、頂峰。等長動作則說明進入、維持、退出。 */
  readonly instructions: readonly [string, string, string, string];
  readonly breathing: string;
  readonly commonMistakes: readonly [string, string] | readonly [string, string, string];
}

export const exercisesData = [
  {
    id: "bench_press", name: "槓鈴平板臥推 (Barbell Bench Press)", category: "chest",
    equipment: "槓鈴", difficulty: "中階", primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"], animationType: "press_horizontal",
    instructions: [
      "仰躺平凳，雙腳穩踩地面，肩胛向後下方穩住；握距略寬於肩，手腕疊在前臂上方，槓鈴移至肩線上方。",
      "以約 2–3 秒控制下放至胸骨下段附近，手肘與軀幹約呈 45–70 度；只下降到肩膀舒適、前臂大致垂直的位置。",
      "腳掌持續出力，胸部帶動上臂推起；槓鈴略向肩線回移，保持臀部與上背接觸凳面。",
      "推至手肘自然伸直，在肩線上方短暫穩定；維持肩胛支撐，不用聳肩或撞擊手肘鎖定來完成動作。",
    ],
    breathing: "下放時吸氣並穩住腹部，推起通過最吃力的位置時吐氣；避免整組持續憋氣。",
    commonMistakes: ["不要讓槓鈴彈胸或手腕大幅後折，必要時降低重量。", "避免手肘完全外張、臀部抬離凳面；較重的組數使用安全槓或保護者。"],
  },
  {
    id: "incline_dumbbell_press", name: "上斜啞鈴臥推 (Incline Dumbbell Press)", category: "chest",
    equipment: "啞鈴", difficulty: "中階", primaryMuscles: ["chest"],
    secondaryMuscles: ["front_delts", "triceps"], animationType: "press_incline",
    instructions: [
      "凳面先設約 30–45 度上斜（影片採約 45 度），雙腳踩穩；將啞鈴帶到胸部兩側，肩胛穩定、手腕與手肘上下對齊。",
      "緩慢將啞鈴降至上胸兩側，手肘略向身體收；依肩關節活動度決定深度，不追求啞鈴碰到胸口。",
      "以胸部發力向上、略向內推，雙側同步；讓前臂維持支撐啞鈴，不以腰部挺起增加行程。",
      "啞鈴到肩線上方時穩住，保留兩鈴間距，不互相敲擊；肩膀仍貼穩凳面。",
    ],
    breathing: "下降時吸氣，向上推時緩緩吐氣；每次重複重新建立腹部張力。",
    commonMistakes: ["調高凳角後重新減重；若需要挺腰或抬臀完成，先調整姿勢與重量。", "不要過度下放或把啞鈴直接丟下；結束時先移回大腿再坐起。"],
  },
  {
    id: "machine_chest_press", name: "坐姿機械胸推 (Seated Machine Chest Press)", category: "chest",
    equipment: "滑輪/機械", difficulty: "初階", primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front_delts"], animationType: "press_seated",
    instructions: [
      "調整座椅讓握把約在胸部中段，背部貼住靠墊，雙腳穩定踩地；選擇不會把肩膀拉到身後太遠的起始位置。",
      "控制握把回到胸部兩側，保持手肘略低於肩；重量片接近落下前減速，不讓肩膀向前滑動。",
      "胸部帶動手臂沿機械軌道向前推，軀幹保持貼墊，左右握把同步前進。",
      "推到手臂接近伸直時停一下，維持胸部張力，再平順回程。",
    ],
    breathing: "握把回收時吸氣，向前推時吐氣。",
    commonMistakes: ["座椅過低會使手肘高於肩線；先調整座椅再加重量。", "不要聳肩、挺腰或讓重量片互撞，回程同樣需要控制。"],
  },
  {
    id: "push_up", name: "伏地挺身 (Push-up)", category: "chest", equipment: "徒手", difficulty: "初階",
    primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front_delts", "core"], animationType: "push_up",
    instructions: [
      "雙手略寬於肩放地，肩膀在手腕附近；腳尖支撐，收緊腹部與臀部，頭、軀幹與腿形成一直線。",
      "手肘向後外側彎曲，整個身體一起下降；胸口接近地面前仍維持腹壓與中立頸部。",
      "把地面推離身體，胸部與手臂共同出力；肩膀、髖部同步上升，不先抬胸或甩腰。",
      "手肘自然伸直，肩胛可順勢向前滑動並推穩地面；保持腹部收緊再開始下一次。",
    ],
    breathing: "下降時吸氣，推離地面時吐氣；難以維持身體直線時改為斜板版本。",
    commonMistakes: ["避免腰部下塌或頭部前伸，疲勞時先提高支撐面。", "不要讓手肘與軀幹呈 90 度大幅外張，手掌分散承重。"],
  },
  {
    id: "barbell_row", name: "槓鈴俯身划船 (Bent-over Barbell Row)", category: "back",
    equipment: "槓鈴", difficulty: "中階", primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "rear_delts", "lower_back", "core"], animationType: "row_pull",
    instructions: [
      "雙腳與髖同寬，膝微彎並向後折髖，使軀幹前傾且背部維持中立；雙手握槓、手臂自然垂下。",
      "每次回程慢慢伸展手肘，槓鈴沿大腿前方下移，允許肩胛適度前滑但不要拱背。",
      "把手肘朝髖部方向拉，將槓鈴帶向肚臍至下肋附近；保持前傾角度，不用站起身甩槓。",
      "肩胛向後靠攏，槓鈴在腹部附近短停；肩膀遠離耳朵，避免為了碰身體而過度拉肘。",
    ],
    breathing: "槓鈴下放時吸氣，向腹部拉起時吐氣，整個動作保持軀幹穩定。",
    commonMistakes: ["不要用腰部反覆甩動槓鈴；若無法固定軀幹，改輕重量或胸靠式划船。", "避免圓背與抬頭看鏡子，視線落在前下方。"],
  },
  {
    id: "one_arm_dumbbell_row", name: "單臂啞鈴划船 (One-arm Dumbbell Row)", category: "back",
    equipment: "啞鈴", difficulty: "初階", primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "rear_delts", "core"], animationType: "row_single",
    instructions: [
      "一手與同側膝支撐平凳，另一腳踩地；背部接近平坦，持鈴手臂垂在肩膀下方，骨盆朝地面。",
      "控制啞鈴下放至手臂自然伸展，肩胛可向前滑動，但支撐側肩膀與軀幹不可塌下。",
      "以手肘向後、向髖部拉的感覺帶動啞鈴，前臂跟隨，不把啞鈴彎舉到胸口。",
      "啞鈴到腰旁時停一下，維持骨盆與胸口朝下，再慢慢伸展手臂；左右側使用相同控制速度。",
    ],
    breathing: "下放啞鈴時吸氣，向腰側拉起時吐氣。",
    commonMistakes: ["不要扭轉軀幹把重量甩高，優先保持骨盆水平。", "避免聳肩或將手肘拉到肩膀疼痛的位置，支撐手保持穩定。"],
  },
  {
    id: "lat_pulldown", name: "滑輪高位下拉 (Lat Pulldown)", category: "back",
    equipment: "滑輪/機械", difficulty: "初階", primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "upper_back"], animationType: "pulldown",
    instructions: [
      "調整大腿固定墊，雙腳踩地；握距略寬於肩，軀幹輕微後傾，手臂向上延伸且肋骨不外翻。",
      "回程時緩慢伸展手肘，讓肩胛順勢向上旋轉；維持坐姿穩定，不被重量拉離座位。",
      "把手肘朝身體兩側與下方帶，將握桿拉向鎖骨至上胸前方，胸口自然抬起。",
      "握桿到上胸附近短停，感受腋下背部收縮；不為了碰胸而大幅後仰或折手腕。",
    ],
    breathing: "向上回放時吸氣，下拉發力時吐氣。",
    commonMistakes: ["不要做頸後下拉或猛甩軀幹，握桿始終走身體前側。", "避免握距過寬與聳肩拉到底，先選可完整控制的行程。"],
  },
  {
    id: "pull_up", name: "正握引體向上 (Pull-up)", category: "back", equipment: "徒手", difficulty: "進階",
    primaryMuscles: ["lats"], secondaryMuscles: ["biceps", "upper_back", "core"], animationType: "pull_up",
    instructions: [
      "正握固定橫槓，握距略寬於肩；手臂伸展、肩膀保有主動支撐，腹部與臀部收緊，雙腿自然垂下或微彎。",
      "下降時慢慢伸展手肘，肩胛順勢上轉；降至可控制且肩膀舒適的懸吊位置，不突然墜落。",
      "想像將手肘拉向肋骨，把身體往橫槓拉近；保持軀幹穩定，避免擺腿或踢腳借力。",
      "下巴自然越過橫槓或達到可控制高度時短停，頸部保持中立，再緩慢下降。",
    ],
    breathing: "身體下降時吸氣，向上拉時吐氣；若無法控制下放，使用輔助機或彈力帶。",
    commonMistakes: ["不要伸長脖子硬湊下巴高度，肩膀疼痛時縮小行程並停止硬拉。", "避免每次從頂端直接落下，疲勞時改用輔助版本。"],
  },
  {
    id: "barbell_back_squat", name: "槓鈴背蹲 (Barbell Back Squat)", category: "legs",
    equipment: "槓鈴", difficulty: "中階", primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "lower_back", "core"], animationType: "squat",
    instructions: [
      "槓鈴放在上斜方肌肌肉平台而非頸椎，雙腳約肩寬、腳尖略外開；站穩後收緊腹部，視線朝前下方。",
      "髖與膝一起彎曲下降，膝蓋沿腳尖方向前進；維持腳跟、大拇趾根與小拇趾根三點承重，蹲到可保持中立背部的深度。",
      "以整個腳掌推地，髖部與胸口同步上升，讓槓鈴大致維持在足中段上方。",
      "站直時收緊臀部與大腿，骨盆回到中立；不要向後頂腰或硬撞膝關節。",
    ],
    breathing: "下降前吸氣並建立腹部張力，站起通過困難點後吐氣；每次重複重新準備。",
    commonMistakes: ["避免膝蓋失控內夾、腳跟離地或腰背在底部明顯彎曲。", "不要將膝蓋不能超過腳尖當成硬規則；依腿長與活動度調整站距，重組使用安全槓。"],
  },
  {
    id: "dumbbell_romanian_deadlift", name: "啞鈴羅馬尼亞硬舉 (Dumbbell Romanian Deadlift)", category: "legs",
    equipment: "啞鈴", difficulty: "中階", primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower_back", "forearms", "core"], animationType: "hinge",
    instructions: [
      "雙腳與髖同寬，啞鈴置於大腿前方，膝微彎；背部中立、肩膀穩定，腹部保持張力。",
      "把臀部向後推，啞鈴貼近腿部下滑；膝角度只小幅變化，降到腿後有拉伸感且背部仍可維持中立的位置。",
      "以臀腿把地面推開，髖部向前回到站姿；啞鈴沿原路貼腿上升，不用腰背把重量拉起。",
      "站直後自然收緊臀部，肋骨與骨盆上下對齊，不把身體向後折。",
    ],
    breathing: "折髖下降時吸氣，伸髖站起時吐氣，腹部始終保持支撐。",
    commonMistakes: ["不要為了碰地而圓背，行程由腿後柔軟度與控制能力決定。", "避免把動作變成深蹲，或讓啞鈴遠離身體增加腰部力矩。"],
  },
  {
    id: "leg_press", name: "機械腿推 (Leg Press)", category: "legs", equipment: "滑輪/機械", difficulty: "初階",
    primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "calves"], animationType: "leg_press",
    instructions: [
      "背部與骨盆貼住靠墊，雙腳約肩寬放踏板中段；確認安全卡榫與座椅角度，膝蓋朝腳尖方向。",
      "控制踏板下降，髖膝一起彎曲；骨盆即將離開靠墊前停止，不追求膝蓋碰到胸口。",
      "以整個腳掌推踏板，兩腿平均出力，背部與骨盆持續貼墊，避免只用腳尖蹬。",
      "推至膝蓋接近伸直便減速，保持肌肉承重；完成整組後確實扣回安全卡榫。",
    ],
    breathing: "踏板靠近時吸氣，推離踏板時吐氣。",
    commonMistakes: ["避免下降過深導致骨盆捲起、下背離墊。", "不要用手推膝蓋、把膝蓋鎖死或在未扣安全卡榫時離開機台。"],
  },
  {
    id: "glute_bridge", name: "徒手臀橋 (Bodyweight Glute Bridge)", category: "legs", equipment: "徒手", difficulty: "初階",
    primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings", "core"], animationType: "bridge",
    instructions: [
      "仰躺屈膝，腳掌踩地約與髖同寬，腳跟放在頂端時小腿接近垂直的位置；手臂放身側、肋骨收好。",
      "從頂端慢慢放下骨盆，讓臀部接近地面，仍維持腹部張力，不讓腰部反覆拱起。",
      "透過腳掌推地並收緊臀部，把骨盆抬起；膝蓋與腳尖保持同方向。",
      "肩、髖與膝接近一直線時停 1 秒，以臀部收縮維持高度，不用下背繼續往上頂。",
    ],
    breathing: "下降時吸氣，抬髖並收縮臀部時吐氣。",
    commonMistakes: ["不要過度挺腰換取高度，抬起時維持肋骨下收。", "腿後抽筋時可縮小行程、稍微調近腳跟，避免只用腳尖出力。"],
  },
  {
    id: "barbell_overhead_press", name: "站姿槓鈴肩推 (Standing Barbell Overhead Press)", category: "shoulders",
    equipment: "槓鈴", difficulty: "中階", primaryMuscles: ["front_delts", "side_delts"],
    secondaryMuscles: ["triceps", "upper_back", "core"], animationType: "press_vertical",
    instructions: [
      "雙腳與髖同寬，握距略寬於肩，槓鈴停在鎖骨前方；手肘略在槓前，腹部與臀部收緊。",
      "控制槓鈴回到上胸前，頭部略向後讓出路徑；保持手腕疊在前臂上，不讓肋骨向前翻。",
      "將槓鈴向上推，通過額頭後讓頭回到雙臂之間；保持重量接近身體中線，不用腿部彈起。",
      "手臂伸直後，肩胛自然向上旋轉、上臂靠近耳側；軀幹直立，避免以腰部後仰完成鎖定。",
    ],
    breathing: "下降時吸氣並穩住軀幹，向上推過困難點時吐氣。",
    commonMistakes: ["不要把肩胛一路壓低，過頭時需要自然上轉。", "避免過度後仰、折腕與槓鈴繞大圈；肩部活動受限時改用較舒適的推舉角度。"],
  },
  {
    id: "dumbbell_lateral_raise", name: "啞鈴側平舉 (Dumbbell Lateral Raise)", category: "shoulders",
    equipment: "啞鈴", difficulty: "初階", primaryMuscles: ["side_delts"],
    secondaryMuscles: ["front_delts", "upper_back"], animationType: "raise",
    instructions: [
      "站穩並微彎膝，啞鈴垂於身側，手肘微彎；手臂略在身體正側面的前方，手腕保持中立。",
      "從肩高附近慢慢放下啞鈴，手肘彎曲角度大致不變，避免重量直接掉到大腿旁。",
      "以手肘帶動手臂向兩側上抬，路徑略偏前；軀幹穩定、不靠聳肩或擺動加速。",
      "抬到肩高或個人舒適高度短停，拇指保持自然朝前或略朝上，再控制回程。",
    ],
    breathing: "下降時吸氣，上抬時吐氣。",
    commonMistakes: ["不要刻意小指朝上做倒水姿勢，若夾痛就降低高度或重量。", "避免聳肩、甩腰與使用無法控制離心的重量。"],
  },
  {
    id: "cable_face_pull", name: "滑輪繩索面拉 (Cable Face Pull)", category: "shoulders",
    equipment: "滑輪/機械", difficulty: "中階", primaryMuscles: ["rear_delts", "upper_back"],
    secondaryMuscles: ["biceps"], animationType: "face_pull",
    instructions: [
      "滑輪設在眼睛附近高度，握繩兩端後退站穩，手臂伸向前方；肋骨收好，肩膀保持自然位置。",
      "緩慢把繩索向前送回，讓肩胛自然前滑，維持頸部放鬆，不被重量拖著向前踉蹌。",
      "把繩索拉向額頭兩側，手肘向外後方移動，前臂順勢外旋；動作幅度以肩膀舒適為準。",
      "雙手到耳側、肩胛向後靠攏時短停，不讓頭往前追繩索，再沿原路回放。",
    ],
    breathing: "繩索回放時吸氣，向臉部拉近時吐氣。",
    commonMistakes: ["不要用過重重量把動作變成後仰划船。", "避免聳肩、頭部前伸或強迫手臂外旋到疼痛角度。"],
  },
  {
    id: "pike_push_up", name: "折髖伏地肩推 (Pike Push-up)", category: "shoulders", equipment: "徒手", difficulty: "中階",
    primaryMuscles: ["front_delts", "side_delts"], secondaryMuscles: ["triceps", "chest", "core"], animationType: "pike_push_up",
    instructions: [
      "雙手肩寬撐地，臀部抬高成倒 V 形，腳跟可離地、膝蓋可微彎；將部分重量移向雙手。",
      "手肘向後外側彎曲，頭部沿雙手前方的三角形區域下降；頸部中立，頭不要實際承受體重。",
      "透過手掌把地面推開，肩部帶動身體回到高位；保留折髖形狀，避免變成一般伏地挺身。",
      "手臂自然伸直，肩胛順勢上轉，穩住肩帶後再開始下一次。",
    ],
    breathing: "頭部下降時吸氣，推離地面時吐氣。",
    commonMistakes: ["不要把頭頂壓在地上或讓手肘完全外張。", "手腕或肩膀無法舒適承重時，先減小前傾與下降幅度。"],
  },
  {
    id: "barbell_biceps_curl", name: "槓鈴二頭彎舉 (Barbell Biceps Curl)", category: "arms",
    equipment: "槓鈴", difficulty: "初階", primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"], animationType: "curl",
    instructions: [
      "站穩、掌心朝前握槓，上臂自然靠近軀幹，手腕中立，膝蓋微彎並收緊腹部。",
      "慢慢伸展手肘讓槓鈴降到大腿前，保留可控制的張力，不讓手肘被重量突然拉直。",
      "以上臂位置大致固定的方式彎曲手肘，把槓鈴帶向胸前；肩膀不前後甩動。",
      "前臂接近上臂時短暫收縮，避免把手肘大幅向前抬來增加高度，再慢慢下放。",
    ],
    breathing: "下放時吸氣，彎舉時吐氣。",
    commonMistakes: ["不要以腰部後仰或膝蓋彈動甩起重量。", "避免手腕內折；直槓不舒服時改用 EZ 槓或啞鈴。"],
  },
  {
    id: "dumbbell_hammer_curl", name: "啞鈴槌式彎舉 (Dumbbell Hammer Curl)", category: "arms",
    equipment: "啞鈴", difficulty: "初階", primaryMuscles: ["biceps", "forearms"],
    secondaryMuscles: [], animationType: "hammer_curl",
    instructions: [
      "雙手持啞鈴、掌心相對，手臂垂於身側，上臂自然靠近身體；站穩並保持肩膀放鬆。",
      "緩慢把啞鈴放回身側，維持掌心相對與手腕中立，手肘伸展到可控制的位置。",
      "彎曲手肘把啞鈴帶向肩前，讓肱肌與肱橈肌等屈肘肌群一起出力，不靠肩膀甩起。",
      "上臂保持穩定，在頂端短停，再以相同路徑回程；雙手可同步或交替，但速度保持一致。",
    ],
    breathing: "下降時吸氣，彎舉時吐氣。",
    commonMistakes: ["不要把手腕彎成鉤狀或讓啞鈴撞到肩膀。", "避免上臂前後擺動與軀幹側甩，降低重量優先維持控制。"],
  },
  {
    id: "cable_triceps_pushdown", name: "滑輪三頭下壓 (Cable Triceps Pushdown)", category: "arms",
    equipment: "滑輪/機械", difficulty: "初階", primaryMuscles: ["triceps"],
    secondaryMuscles: ["forearms", "core"], animationType: "extension",
    instructions: [
      "站在高滑輪前，握直桿或繩索，上臂靠近軀幹，手肘約彎 90 度；軀幹可輕微前傾但保持穩定。",
      "控制手肘彎曲讓握把回升，上臂位置不變；只回到仍可固定肩膀與手肘的位置。",
      "以伸直手肘的方式把握把壓向大腿前方，避免整個肩膀往下砸或用體重壓繩索。",
      "手肘自然伸直時收緊肱三頭肌；使用繩索可自然分開兩端，但不折腕或過度向後拉。",
    ],
    breathing: "握把回升時吸氣，向下伸肘時吐氣。",
    commonMistakes: ["不要把上臂前後晃動成肩關節動作，手肘保持在身側。", "避免手肘硬鎖、折腕或用過重重量壓低整個身體。"],
  },
  {
    id: "diamond_push_up", name: "窄距伏地挺身 (Diamond / Close-grip Push-up)", category: "arms",
    equipment: "徒手", difficulty: "中階", primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest", "front_delts", "core"], animationType: "push_up_narrow",
    instructions: [
      "雙手放在胸口下方、間距小於一般伏地挺身；不必強迫拇指食指相碰，腳尖支撐並讓身體成一直線。",
      "慢慢彎曲手肘，讓手肘較靠近軀幹向後移，胸口朝雙手附近下降，骨盆與肩膀同步。",
      "以手掌推地、肱三頭肌伸肘，整個身體一起上升；保持腹臀張力。",
      "手臂自然伸直並推穩地面，肩胛可適度前移，再開始下一次。",
    ],
    breathing: "下降時吸氣，推起時吐氣；難以維持姿勢時改用高台支撐。",
    commonMistakes: ["不要為了做出鑽石手形而讓手腕疼痛，握距以舒適為優先。", "避免手肘過度外張、腰部下塌或頭部搶先碰地。"],
  },
  {
    id: "barbell_ab_rollout", name: "跪姿槓鈴滾輪 (Kneeling Barbell Ab Rollout)", category: "core",
    equipment: "槓鈴", difficulty: "進階", primaryMuscles: ["abs"],
    secondaryMuscles: ["obliques", "lats", "front_delts", "glutes"], animationType: "rollout",
    instructions: [
      "在防滑地面跪姿，雙手肩寬握可平順滾動的槓鈴，膝下墊軟墊；收緊腹臀，讓肋骨與骨盆對齊。",
      "緩慢把槓鈴向前滾，肩膀前移、髖部逐漸伸展；只伸到仍能避免腰部下塌的距離。",
      "以腹部抗伸展並將槓鈴拉回身下，軀幹與髖部一起回收，不先把臀部大幅坐回腳跟。",
      "回到肩膀接近槓鈴上方時重新穩住腹部，不用過度拱背或聳肩結束。",
    ],
    breathing: "向前滾時吸氣並維持腹壓，向後回收時緩緩吐氣；不要追求長距離而失去腰部控制。",
    commonMistakes: ["不要讓腰椎過度伸展，初學者可面向牆壁限制滾動距離。", "確認槓片能順暢轉動且不會滑脫，肩膀或下背疼痛時停止該次動作。"],
  },
  {
    id: "dumbbell_side_bend", name: "單側啞鈴側屈 (Dumbbell Side Bend)", category: "core",
    equipment: "啞鈴", difficulty: "初階", primaryMuscles: ["obliques"],
    secondaryMuscles: ["abs", "lower_back"], animationType: "side_bend",
    instructions: [
      "雙腳與髖同寬，一手持啞鈴放身側，另一手放髖部；骨盆保持水平，胸口朝前，膝蓋微彎。",
      "向持鈴側緩慢側彎小幅度，讓對側軀幹肌群控制拉長；啞鈴沿腿側下滑，不旋轉身體。",
      "以對側腰腹肌群把軀幹拉回直立，骨盆不橫移，肩膀不前後轉動。",
      "回到中立直立時短停，不越過中線猛甩；做完一側後換手，兩側採相同次數。",
    ],
    breathing: "側彎下降時吸氣，回到直立時吐氣。",
    commonMistakes: ["避免使用過重啞鈴或追求極端側彎角度，動作保持小而可控。", "不要同時雙手各拿等重啞鈴抵銷側向力矩，也不要伴隨扭腰。"],
  },
  {
    id: "kneeling_cable_crunch", name: "跪姿滑輪捲腹 (Kneeling Cable Crunch)", category: "core",
    equipment: "滑輪/機械", difficulty: "中階", primaryMuscles: ["abs"],
    secondaryMuscles: ["obliques"], animationType: "plank_crunch",
    instructions: [
      "面向高滑輪跪下，繩索握在額頭兩側，髖部大致固定在膝蓋上方；手臂保持穩定，腹部先建立張力。",
      "從捲曲位置慢慢展開軀幹，回到自然中立即可，不讓重量把腰部向後拉成過度伸展。",
      "想像把肋骨往骨盆方向捲近，以腹部縮短帶動軀幹彎曲；避免只折髖或用手臂把繩索往下拉。",
      "腹部收緊時短停，骨盆與髖部維持相對穩定，再控制軀幹展開。",
    ],
    breathing: "軀幹展開時吸氣，肋骨捲向骨盆時緩緩吐氣。",
    commonMistakes: ["不要把臀部一直坐向腳跟，或把動作變成全身鞠躬。", "避免用頸部猛點頭或手臂下拉重量，繩索位置保持在頭側。"],
  },
  {
    id: "forearm_plank", name: "前臂棒式 (Forearm Plank)", category: "core", equipment: "徒手", difficulty: "初階",
    primaryMuscles: ["abs", "obliques"], secondaryMuscles: ["glutes", "front_delts", "quads"], animationType: "plank",
    instructions: [
      "前臂與腳尖撐地，手肘位於肩膀下方；收緊腹臀，讓頭、肩、骨盆與腳跟接近一直線。",
      "這是等長動作，沒有反覆離心下放；進入支撐後保持腰部中立，疲勞時不要任由骨盆往下掉。",
      "持續把前臂推向地面，以腹部抗伸展並維持臀腿張力；全程規律呼吸，不要反覆捲腹或抬臀。",
      "維持可正常呼吸且姿勢不變形的時間；結束時先放下膝蓋，平順退出，不撐到腰部疼痛。",
    ],
    breathing: "全程平穩吸吐氣，吐氣時輕收肋骨；不可用長時間憋氣換取支撐時間。",
    commonMistakes: ["不要塌腰、過度抬臀或仰頭，時間短一點也要保持姿勢。", "手肘不要離肩膀太遠；可改為跪姿棒式降低負荷。"],
  },
  {
    id: "reverse_grip_lat_pulldown", name: "反手高位下拉 (Reverse-grip Lat Pulldown)", category: "back",
    equipment: "滑輪/機械", difficulty: "中階", primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "upper_back"], animationType: "pulldown_supinated",
    instructions: [
      "調好座椅與大腿固定墊，掌心朝自己、約肩寬握桿；雙腳踩穩，胸口自然抬起，軀幹只輕微後傾。",
      "控制握桿回到頭部上方，手肘慢慢伸展、肩胛順勢上轉，保持肋骨與骨盆穩定，不被重量拉離座位。",
      "以手肘往下、往肋骨靠近的方式帶動握桿，下拉至上胸前方，避免只靠二頭肌彎舉或用腰部擺動。",
      "握桿到上胸附近時停一下，維持背闊肌張力與手腕中立，再以同一路徑慢慢回放。",
    ],
    breathing: "回放時吸氣，下拉發力時吐氣，軀幹保持穩定。",
    commonMistakes: ["反手握桿若造成手腕或手肘不適，改用較舒適的中立握把。", "不要過度後仰或把握桿拉到腹部，也不要做頸後下拉。"],
  },
  {
    id: "seated_machine_row", name: "坐姿寬距對握划船 (Seated Wide Neutral-grip Row)", category: "back",
    equipment: "滑輪/機械", difficulty: "初階", primaryMuscles: ["upper_back"],
    secondaryMuscles: ["lats", "rear_delts", "biceps"], animationType: "row_seated",
    instructions: [
      "坐穩座墊、雙腳踩踏板並保留膝蓋微彎，以掌心相對握住略寬於肩的握把；背部自然中立，肩膀遠離耳朵。",
      "慢慢伸展手肘、讓握把向前回放，肩胛可自然前滑；不為了增加行程而圓背或讓骨盆往前捲。",
      "將手肘朝斜後方拉，握把靠近下胸，肩胛自然向後靠攏，感受中背出力；軀幹大致直立，不靠後仰甩動。",
      "握把靠近軀幹時短暫停留，感受肩胛間與背闊肌收縮，再控制手臂向前伸展。",
    ],
    breathing: "握把向前回放時吸氣，向身體拉近時吐氣。",
    commonMistakes: ["避免聳肩、抬下巴或用腰部反覆前後擺動。", "不要為了把握把拉到身體而讓手肘過度後伸，採用肩膀舒適的行程。"],
  },
  ...additionalExercises,
] as const satisfies readonly Exercise[];

export const exerciseById: ReadonlyMap<string, Exercise> = new Map<string, Exercise>(
  exercisesData.map((exercise) => [exercise.id, exercise]),
);
