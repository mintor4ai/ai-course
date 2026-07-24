CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_key ON prompt_versions(prompt_key);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions(prompt_key, is_active) WHERE is_active = true;
