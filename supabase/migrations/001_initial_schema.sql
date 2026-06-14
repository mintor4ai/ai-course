-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Participants table (Spanish field names per spec)
CREATE TABLE IF NOT EXISTS participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  nombre        TEXT NOT NULL,
  puesto        TEXT NOT NULL,
  departamento  TEXT NOT NULL,
  email         TEXT NOT NULL,
  curso_fecha   DATE DEFAULT CURRENT_DATE
);

-- Responses table (upserted as participant progresses)
CREATE TABLE IF NOT EXISTS responses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  aprendizajes        JSONB DEFAULT '[]',
  tareas_repetitivas  JSONB DEFAULT '[]',
  chat_messages       JSONB DEFAULT '[]',
  horas_proyectadas   TEXT,
  area_impacto        TEXT,
  nivel_listo         TEXT,
  plan_90_dias        JSONB DEFAULT '[]',
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Diagnostics table
CREATE TABLE IF NOT EXISTS diagnostics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  html_content    TEXT,
  sent_at         TIMESTAMPTZ,
  email_status    TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_participant_id ON diagnostics(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_curso_fecha ON participants(curso_fecha);

-- Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "public_select_participants" ON participants FOR SELECT USING (true);
CREATE POLICY "public_insert_responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "public_select_responses"  ON responses FOR SELECT USING (true);
CREATE POLICY "public_update_responses"  ON responses FOR UPDATE USING (true);
CREATE POLICY "public_insert_diagnostics" ON diagnostics FOR INSERT WITH CHECK (true);
CREATE POLICY "public_select_diagnostics" ON diagnostics FOR SELECT USING (true);
CREATE POLICY "public_update_diagnostics" ON diagnostics FOR UPDATE USING (true);

-- Admin view for dashboard and export
CREATE OR REPLACE VIEW admin_full_view AS
SELECT
  p.id            AS participant_id,
  p.nombre,
  p.puesto,
  p.departamento,
  p.email,
  p.curso_fecha,
  p.created_at    AS registro_at,
  r.aprendizajes,
  r.tareas_repetitivas,
  r.horas_proyectadas,
  r.area_impacto,
  r.nivel_listo,
  r.plan_90_dias,
  (d.html_content IS NOT NULL) AS diagnostico_generado,
  d.email_status,
  d.sent_at
FROM participants p
LEFT JOIN responses  r ON r.participant_id = p.id
LEFT JOIN diagnostics d ON d.participant_id = p.id;
