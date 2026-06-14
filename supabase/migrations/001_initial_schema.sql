-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diagnostics table
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  html_content TEXT,
  plan_90_days TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_responses_step ON responses(step);
CREATE INDEX IF NOT EXISTS idx_diagnostics_participant_id ON diagnostics(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Policies: allow insert and select for anon (client-side app)
CREATE POLICY "Allow public insert participants" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert responses" ON responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select responses" ON responses
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert diagnostics" ON diagnostics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select diagnostics" ON diagnostics
  FOR SELECT USING (true);

CREATE POLICY "Allow public update diagnostics" ON diagnostics
  FOR UPDATE USING (true);
