-- Track how many times each respondent has been invited
ALTER TABLE survey_respondents
  ADD COLUMN IF NOT EXISTS invite_count INTEGER NOT NULL DEFAULT 0;
