-- Survey campaigns (pre-course or post-course)
CREATE TABLE IF NOT EXISTS survey_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL,
  empresa        TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'pre',   -- 'pre' | 'post'
  descripcion    TEXT,
  survey_config  JSONB DEFAULT '{}',
  survey_version TEXT DEFAULT '1.0.0',
  status         TEXT DEFAULT 'draft',          -- 'draft' | 'active' | 'closed'
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- One respondent per email per campaign, each gets a unique token URL
CREATE TABLE IF NOT EXISTS survey_respondents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES survey_campaigns(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  nombre       TEXT,
  token        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status       TEXT DEFAULT 'pending',  -- 'pending' | 'sent' | 'completed' | 'abandoned'
  sent_at      TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, email)
);

-- Survey answers + calculated profile per respondent
CREATE TABLE IF NOT EXISTS survey_responses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id           UUID NOT NULL REFERENCES survey_respondents(id) ON DELETE CASCADE,
  campaign_id             UUID NOT NULL REFERENCES survey_campaigns(id) ON DELETE CASCADE,
  answers                 JSONB DEFAULT '{}',
  scores                  JSONB DEFAULT '{}',
  profile_name            TEXT,
  profile_score           DECIMAL(5,2),
  possible_ai_champion    BOOLEAN DEFAULT false,
  recommended_level       TEXT,
  recommended_topics      JSONB DEFAULT '[]',
  diagnostic_html         TEXT,
  response_status         TEXT DEFAULT 'in_progress',
  started_at              TIMESTAMPTZ DEFAULT now(),
  completed_at            TIMESTAMPTZ,
  completion_time_seconds INTEGER,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_respondents_campaign ON survey_respondents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_survey_respondents_token ON survey_respondents(token);
CREATE INDEX IF NOT EXISTS idx_survey_responses_respondent ON survey_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_campaign ON survey_responses(campaign_id);

ALTER TABLE survey_campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc_campaigns"   ON survey_campaigns   USING (true) WITH CHECK (true);
CREATE POLICY "svc_respondents" ON survey_respondents USING (true) WITH CHECK (true);
CREATE POLICY "svc_responses"   ON survey_responses   USING (true) WITH CHECK (true);
