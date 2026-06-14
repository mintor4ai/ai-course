-- Events table for session management
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  empresa           TEXT NOT NULL,
  fecha_evento      DATE NOT NULL,
  mensaje_bienvenida TEXT,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Add event_id to participants (nullable for backwards compatibility)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_codigo        ON events(codigo);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);

-- RLS for events (public read for participant entry, service role for write)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_events" ON events FOR SELECT USING (true);

-- Update admin view to include event info
CREATE OR REPLACE VIEW admin_full_view AS
SELECT
  p.id            AS participant_id,
  p.nombre,
  p.puesto,
  p.departamento,
  p.email,
  p.curso_fecha,
  p.event_id,
  e.nombre        AS evento_nombre,
  e.empresa       AS evento_empresa,
  e.fecha_evento,
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
LEFT JOIN events     e ON e.id = p.event_id
LEFT JOIN responses  r ON r.participant_id = p.id
LEFT JOIN diagnostics d ON d.participant_id = p.id;
