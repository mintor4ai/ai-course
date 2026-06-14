-- Add course rating field to responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS calificacion SMALLINT;
