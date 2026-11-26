/** References checked against publisher instructions and linked videos.
 * A source review does not validate our old synthetic animation.
 * Variant differences are shown beside the player, never silently substituted. */
export interface ExerciseSource {
 publisher:string; title:string; url:string; reviewedAt:string; variantNote?:string;
 video:{provider:"youtube";id:string}|{provider:"vimeo";id:string;hash?:string}|{provider:"external";url:string};
}
export const exerciseSources:Readonly<Record<string,ExerciseSource>> = {
  "push_up": {
    "publisher": "NASM",
    "title": "Push-Up",
    "url": "https://www.nasm.org/resource-center/exercise-library/push-up",
    "video": {
      "provider": "youtube",
      "id": "WDIpL0pjun0"
    },
    "reviewedAt": "2026-11-26"
  },
  "incline_dumbbell_press": {
    "publisher": "NASM",
    "title": "Two-Arm Incline Dumbbell Chest Press",
    "url": "https://www.nasm.org/resource-center/exercise-library/two-arm-incline-dumbbell-chest-press",
    "video": {
      "provider": "youtube",
      "id": "JKnpHchOWPU"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "影片採約 45° 上斜；先以能穩住上背、肩部舒服的角度練習，調整凳角時重新減重。"
  },
  "machine_chest_press": {
    "publisher": "NASM",
    "title": "Chest Press Machine",
    "url": "https://www.nasm.org/resource-center/exercise-library/chest-press-machine",
    "video": {
      "provider": "youtube",
      "id": "lRo9zZ7EwpM"
    },
    "reviewedAt": "2026-11-26"
  },
  "bench_press": {
    "publisher": "NASM",
    "title": "Barbell Bench Press",
    "url": "https://www.nasm.org/resource-center/exercise-library/barbell-bench-press",
    "video": {
      "provider": "youtube",
      "id": "CayG6UYqL8g"
    },
    "reviewedAt": "2026-11-26"
  },
  "pull_up": {
    "publisher": "NASM",
    "title": "Pull-Up",
    "url": "https://www.nasm.org/resource-center/exercise-library/pull-up",
    "video": {
      "provider": "youtube",
      "id": "9yVGh3XbJ34"
    },
    "reviewedAt": "2026-11-26"
  },
  "one_arm_dumbbell_row": {
    "publisher": "Muscle & Strength",
    "title": "one arm dumbbell row",
    "url": "https://www.muscleandstrength.com/exercises/one-arm-dumbbell-row.html",
    "video": {
      "provider": "youtube",
      "id": "YZgVEy6cmaY"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "來源影片為站姿單臂划船；本頁採另一手與同側膝支撐平凳的版本。支撐方式不同，不要把影片的懸空手姿勢套到凳上。"
  },
  "lat_pulldown": {
    "publisher": "Muscle & Strength",
    "title": "lat pull down",
    "url": "https://www.muscleandstrength.com/exercises/lat-pull-down.html",
    "video": {
      "provider": "youtube",
      "id": "iKrKgWR9wbY"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_romanian_deadlift": {
    "publisher": "NASM",
    "title": "Dumbbell Romanian Deadlift",
    "url": "https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift",
    "video": {
      "provider": "youtube",
      "id": "V8Hdl1FiNt4"
    },
    "reviewedAt": "2026-11-26"
  },
  "barbell_row": {
    "publisher": "Muscle & Strength",
    "title": "bent over barbell row",
    "url": "https://www.muscleandstrength.com/exercises/bent-over-barbell-row.html",
    "video": {
      "provider": "youtube",
      "id": "paCfxhgW6bI"
    },
    "reviewedAt": "2026-11-26"
  },
  "leg_press": {
    "publisher": "NASM",
    "title": "Leg Press",
    "url": "https://www.nasm.org/resource-center/exercise-library/leg-press",
    "video": {
      "provider": "youtube",
      "id": "cDGOn-yfKJA"
    },
    "reviewedAt": "2026-11-26"
  },
  "glute_bridge": {
    "publisher": "NASM",
    "title": "Floor Bridge",
    "url": "https://www.nasm.org/resource-center/exercise-library/floor-bridge",
    "video": {
      "provider": "youtube",
      "id": "Z3cY3d3BBo4"
    },
    "reviewedAt": "2026-11-26"
  },
  "barbell_back_squat": {
    "publisher": "Muscle & Strength",
    "title": "squat",
    "url": "https://www.muscleandstrength.com/exercises/squat.html",
    "video": {
      "provider": "youtube",
      "id": "R2dMsNhN3DE"
    },
    "reviewedAt": "2026-11-26"
  },
  "pike_push_up": {
    "publisher": "NASM",
    "title": "Pike Push-Up",
    "url": "https://www.youtube.com/watch?v=XckEEwa1BPI",
    "video": {
      "provider": "youtube",
      "id": "XckEEwa1BPI"
    },
    "reviewedAt": "2026-11-26"
  },
  "cable_face_pull": {
    "publisher": "NASM",
    "title": "Face Pull",
    "url": "https://www.nasm.org/resource-center/exercise-library/face-pull",
    "video": {
      "provider": "youtube",
      "id": "eTCBSFlCJ_s"
    },
    "reviewedAt": "2026-11-26"
  },
  "barbell_overhead_press": {
    "publisher": "Muscle & Strength",
    "title": "military press",
    "url": "https://www.muscleandstrength.com/exercises/military-press.html",
    "video": {
      "provider": "youtube",
      "id": "j7ULT6dznNc"
    },
    "reviewedAt": "2026-11-26"
  },
  "barbell_biceps_curl": {
    "publisher": "NASM",
    "title": "Barbell Bicep Curl",
    "url": "https://www.nasm.org/resource-center/exercise-library/barbell-bicep-curl",
    "video": {
      "provider": "youtube",
      "id": "pQfJR-sSIvA"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_hammer_curl": {
    "publisher": "Muscle & Strength",
    "title": "alternate standing hammer curl",
    "url": "https://www.muscleandstrength.com/exercises/alternate-standing-hammer-curl.html",
    "video": {
      "provider": "vimeo",
      "id": "756794147"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "影片採左右交替；保持掌心相對。每側做相同次數，一側完成回放後再換側。"
  },
  "cable_triceps_pushdown": {
    "publisher": "Muscle & Strength",
    "title": "tricep extension",
    "url": "https://www.muscleandstrength.com/exercises/tricep-extension.html",
    "video": {
      "provider": "youtube",
      "id": "mpZ9VRisAyw"
    },
    "reviewedAt": "2026-11-26"
  },
  "diamond_push_up": {
    "publisher": "Muscle & Strength",
    "title": "close grip push up",
    "url": "https://www.muscleandstrength.com/exercises/close-grip-push-up.html",
    "video": {
      "provider": "vimeo",
      "id": "756784503",
      "hash": "8b3ba1decc"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "來源為窄距伏地挺身；手掌可接近菱形，但不必強迫拇指與食指相碰。手腕舒服、手肘不外翻優先。"
  },
  "dumbbell_side_bend": {
    "publisher": "Muscle & Strength",
    "title": "dumbbell side bends",
    "url": "https://www.muscleandstrength.com/exercises/dumbbell-side-bends.html",
    "video": {
      "provider": "vimeo",
      "id": "877885243"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "本頁採單手持鈴；影片示範可見雙手持鈴。練習時只保留一側負重，骨盆固定，小幅側彎後回到直立。"
  },
  "forearm_plank": {
    "publisher": "NASM",
    "title": "Plank",
    "url": "https://www.nasm.org/resource-center/exercise-library/plank",
    "video": {
      "provider": "youtube",
      "id": "mwlp75MS6Rg"
    },
    "reviewedAt": "2026-11-26"
  },
  "kneeling_cable_crunch": {
    "publisher": "Muscle & Strength",
    "title": "cable crunch",
    "url": "https://www.muscleandstrength.com/exercises/cable-crunch.html",
    "video": {
      "provider": "vimeo",
      "id": "760008287"
    },
    "reviewedAt": "2026-11-26"
  },
  "seated_machine_row": {
    "publisher": "NASM",
    "title": "Seated Machine Row Close Grip",
    "url": "https://www.nasm.org/resource-center/exercise-library/seated-machine-row-close-grip",
    "video": {
      "provider": "youtube",
      "id": "k0cTJCfxa0Y"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "來源為窄距對握划船；本頁為寬距對握。握把較寬時手肘往斜後方移動，終點以肩部舒服為準，不強拉到身後。"
  },
  "barbell_ab_rollout": {
    "publisher": "Muscle & Strength",
    "title": "barbell abdominal rollouts",
    "url": "https://www.muscleandstrength.com/exercises/abdominal-barbell-rollouts.html",
    "video": {
      "provider": "vimeo",
      "id": "877885260"
    },
    "reviewedAt": "2026-11-26"
  },
  "reverse_grip_lat_pulldown": {
    "publisher": "Muscle & Strength",
    "title": "reverse grip lat pull down",
    "url": "https://www.muscleandstrength.com/exercises/reverse-grip-lat-pull-down.html",
    "video": {
      "provider": "youtube",
      "id": "8DAFwftgZHQ"
    },
    "reviewedAt": "2026-11-26"
  },
  "incline_barbell_press": {
    "publisher": "NASM",
    "title": "Incline Barbell Bench Press",
    "url": "https://www.nasm.org/resource-center/exercise-library/incline-barbell-bench-press",
    "video": {
      "provider": "youtube",
      "id": "BjGLs6KGWUc"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "影片採約 45° 上斜；槓下放至上胸前方。先設好安全槓，再開始出槓。"
  },
  "barbell_deadlift": {
    "publisher": "NASM",
    "title": "Barbell Deadlift",
    "url": "https://www.nasm.org/resource-center/exercise-library/barbell-deadlift",
    "video": {
      "provider": "youtube",
      "id": "Z6gcRfPNcZo"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_chest_fly": {
    "publisher": "Muscle & Strength",
    "title": "dumbbell flys",
    "url": "https://www.muscleandstrength.com/exercises/dumbbell-flys.html",
    "video": {
      "provider": "youtube",
      "id": "-lcbvOddoi8"
    },
    "reviewedAt": "2026-11-26"
  },
  "inverted_row": {
    "publisher": "Muscle & Strength",
    "title": "high inverted row",
    "url": "https://www.muscleandstrength.com/exercises/high-inverted-row.html",
    "video": {
      "provider": "vimeo",
      "id": "756788811",
      "hash": "89d69b02a9"
    },
    "reviewedAt": "2026-11-26"
  },
  "goblet_squat": {
    "publisher": "NASM",
    "title": "Goblet Squat",
    "url": "https://www.nasm.org/resource-center/exercise-library/goblet-squat",
    "video": {
      "provider": "youtube",
      "id": "nfX7IFK9UNI"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "來源示範可能使用壺鈴；本頁用一顆啞鈴，雙手托住上端，保持重量貼近胸前。"
  },
  "neutral_grip_lat_pulldown": {
    "publisher": "Muscle & Strength",
    "title": "v bar pull down",
    "url": "https://www.muscleandstrength.com/exercises/v-bar-pull-down",
    "video": {
      "provider": "youtube",
      "id": "7wEpfpKAiQ0"
    },
    "reviewedAt": "2026-11-26"
  },
  "straight_arm_pulldown": {
    "publisher": "Muscle & Strength",
    "title": "straight arm lat pull down",
    "url": "https://www.muscleandstrength.com/exercises/straight-arm-lat-pull-down.html",
    "video": {
      "provider": "youtube",
      "id": "gDtXrJWPdlY"
    },
    "reviewedAt": "2026-11-26"
  },
  "barbell_hip_thrust": {
    "publisher": "Muscle & Strength",
    "title": "barbell hip thrust",
    "url": "https://www.muscleandstrength.com/exercises/barbell-hip-thrust",
    "video": {
      "provider": "youtube",
      "id": "lAnqN0J_p5A"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_reverse_lunge": {
    "publisher": "Muscle & Strength",
    "title": "dumbbell rear lunge",
    "url": "https://www.muscleandstrength.com/exercises/dumbbell-rear-lunge.html",
    "video": {
      "provider": "youtube",
      "id": "Ix9QZ3Pnneo"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_shoulder_press": {
    "publisher": "Muscle & Strength",
    "title": "standing dumbbell press",
    "url": "https://www.muscleandstrength.com/exercises/standing-dumbbell-press.html",
    "video": {
      "provider": "vimeo",
      "id": "760002177"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_front_raise": {
    "publisher": "Muscle & Strength",
    "title": "dumbbell front raise",
    "url": "https://www.muscleandstrength.com/exercises/dumbbell-front-raise.html",
    "video": {
      "provider": "vimeo",
      "id": "760002236"
    },
    "reviewedAt": "2026-11-26"
  },
  "close_grip_bench_press": {
    "publisher": "NASM",
    "title": "Close Grip Bench Press",
    "url": "https://www.nasm.org/resource-center/exercise-library/close-grip-bench-press",
    "video": {
      "provider": "youtube",
      "id": "LJeqLAmJLfs"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_bench_press": {
    "publisher": "Muscle & Strength",
    "title": "dumbbell bench press",
    "url": "https://www.muscleandstrength.com/exercises/dumbbell-bench-press.html",
    "video": {
      "provider": "youtube",
      "id": "dGqI0Z5ul4k"
    },
    "reviewedAt": "2026-11-26"
  },
  "bent_over_reverse_fly": {
    "publisher": "Muscle & Strength",
    "title": "bent over dumbbell reverse fly",
    "url": "https://www.muscleandstrength.com/exercises/bent-over-dumbbell-reverse-fly.html",
    "video": {
      "provider": "youtube",
      "id": "Fgz_FdzDukE"
    },
    "reviewedAt": "2026-11-26"
  },
  "machine_shoulder_press": {
    "publisher": "Muscle & Strength",
    "title": "machine shoulder press",
    "url": "https://www.muscleandstrength.com/exercises/machine-shoulder-press",
    "video": {
      "provider": "youtube",
      "id": "fj_VAk1jfZ8"
    },
    "reviewedAt": "2026-11-26"
  },
  "reverse_barbell_curl": {
    "publisher": "Muscle & Strength",
    "title": "reverse barbell curl",
    "url": "https://www.muscleandstrength.com/exercises/reverse-barbell-curl.html",
    "video": {
      "provider": "vimeo",
      "id": "760002600"
    },
    "reviewedAt": "2026-11-26"
  },
  "overhead_dumbbell_extension": {
    "publisher": "Muscle & Strength",
    "title": "two arm standing dumbbell extension",
    "url": "https://www.muscleandstrength.com/exercises/two-arm-standing-dumbbell-extension.html",
    "video": {
      "provider": "youtube",
      "id": "VjmgzEmODnI"
    },
    "reviewedAt": "2026-11-26"
  },
  "dead_bug": {
    "publisher": "NASM",
    "title": "Dead Bug",
    "url": "https://www.nasm.org/resource-center/exercise-library/dead-bug",
    "video": {
      "provider": "youtube",
      "id": "bxn9FBrt4-A"
    },
    "reviewedAt": "2026-11-26"
  },
  "bird_dog": {
    "publisher": "NASM",
    "title": "Bird Dog",
    "url": "https://www.nasm.org/resource-center/exercise-library/bird-dog",
    "video": {
      "provider": "youtube",
      "id": "ZdAHe9_HeEw"
    },
    "reviewedAt": "2026-11-26"
  },
  "alternating_dumbbell_curl": {
    "publisher": "Muscle & Strength",
    "title": "alternate standing dumbbell curl",
    "url": "https://www.muscleandstrength.com/exercises/alternating-standing-dumbbell-curl.html",
    "video": {
      "provider": "vimeo",
      "id": "756794096"
    },
    "reviewedAt": "2026-11-26",
    "variantNote": "影片起始掌心已向前；也可由中立握逐漸旋至掌心向上。一次只動一側，另一側保持穩定。"
  },
  "hanging_knee_raise": {
    "publisher": "Muscle & Strength",
    "title": "hanging knee raise",
    "url": "https://www.muscleandstrength.com/exercises/hanging-knee-raise.html",
    "video": {
      "provider": "vimeo",
      "id": "1082967622"
    },
    "reviewedAt": "2026-11-26"
  },
  "dumbbell_lateral_raise": {
    "publisher": "NASM",
    "title": "How to do a Dumbbell Lateral Raise",
    "url": "https://www.youtube.com/watch?v=XPPfnSEATJA",
    "video": {
      "provider": "youtube",
      "id": "XPPfnSEATJA"
    },
    "reviewedAt": "2026-11-26"
  },
  "standing_cable_fly": {
    "publisher": "NASM",
    "title": "Two-Arm Standing Cable Fly",
    "url": "https://www.nasm.org/resource-center/exercise-library",
    "video": {
      "provider": "youtube",
      "id": "XNf6TBErGys"
    },
    "reviewedAt": "2026-11-26"
  },
  "standing_pallof_press": {
    "publisher": "NASM",
    "title": "How to do a Pallof Press",
    "url": "https://www.youtube.com/watch?v=f3R99GoYvCs",
    "video": {
      "provider": "youtube",
      "id": "f3R99GoYvCs"
    },
    "reviewedAt": "2026-11-26"
  },
  "standing_calf_raise": {
    "publisher": "Mayo Clinic",
    "title": "Calf raise with dumbbell",
    "url": "https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/calf-raise/vid-20084681",
    "video": {
      "provider": "external",
      "url": "https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/calf-raise/vid-20084681"
    },
    "variantNote": "來源為啞鈴提踵影片。本頁先做徒手、腳跟落到平地的版本；省略啞鈴，需要時扶固定物，不直接照做額外負重。",
    "reviewedAt": "2026-11-26"
  }
};
