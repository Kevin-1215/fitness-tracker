PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm REAL CHECK (height_cm > 0),
  weight_kg REAL CHECK (weight_kg > 0),
  age INTEGER CHECK (age BETWEEN 1 AND 150),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level REAL NOT NULL DEFAULT 1.2 CHECK (activity_level BETWEEN 1 AND 3),
  goal_type TEXT NOT NULL DEFAULT 'maintain' CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  target_calories INTEGER CHECK (target_calories > 0)
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL CHECK (log_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  exercise_code TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  reps INTEGER NOT NULL CHECK (reps >= 0),
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date
  ON workout_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS idx_workouts_user_exercise_date
  ON workout_logs(user_id, exercise_code, log_date);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL CHECK (log_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g REAL NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g REAL NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g REAL NOT NULL DEFAULT 0 CHECK (fat_g >= 0)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_user_date
  ON nutrition_logs(user_id, log_date);

-- A JWT is accepted only while its corresponding D1 session exists.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON auth_sessions(expires_at);

-- Shared, atomic rate limits; no KV, Redis, or in-memory security state.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0)
);

CREATE INDEX IF NOT EXISTS idx_auth_limits_window ON auth_rate_limits(window_start);
