CREATE TABLE IF NOT EXISTS survey_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES survey_campaigns(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES survey_respondents(id) ON DELETE CASCADE,
  campaign_name TEXT,
  respondent_email TEXT,
  respondent_nombre TEXT,
  profile_name TEXT,
  profile_score INTEGER,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_notifications_read ON survey_notifications(read, created_at DESC);

ALTER TABLE survey_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc_notifications" ON survey_notifications USING (true) WITH CHECK (true);
