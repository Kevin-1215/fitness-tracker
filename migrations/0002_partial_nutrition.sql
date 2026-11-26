-- Additive migration: retain all existing meals, calories and macros.
-- Unknown values are stored as zero with an explicit known=0 flag, and returned
-- as JSON null. Existing clients supplying numeric macros remain compatible.
ALTER TABLE nutrition_logs ADD COLUMN carbs_known INTEGER NOT NULL DEFAULT 1 CHECK (carbs_known IN (0,1));
ALTER TABLE nutrition_logs ADD COLUMN fat_known INTEGER NOT NULL DEFAULT 1 CHECK (fat_known IN (0,1));
