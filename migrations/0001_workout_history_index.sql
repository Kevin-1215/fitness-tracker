CREATE INDEX IF NOT EXISTS idx_workouts_user_exercise_date
  ON workout_logs(user_id, exercise_code, log_date);
