-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnostics table
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  html_content TEXT NOT NULL,
  plan_90_days TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_participant_id ON diagnostics(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- Policies: allow insert and select from service role (API routes)
CREATE POLICY "Allow all for service role" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON responses FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON diagnostics FOR ALL USING (true);
