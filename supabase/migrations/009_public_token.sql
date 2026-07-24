-- Add public_token to campaigns (always generated, unique)
ALTER TABLE survey_campaigns ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Generate tokens for all existing campaigns that don't have one
UPDATE survey_campaigns
SET public_token = encode(gen_random_bytes(12), 'hex')
WHERE public_token IS NULL;

-- Add source column to respondents to distinguish public vs invited
ALTER TABLE survey_respondents ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'invited';
