-- Add completion duration to diagnostics
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER;
