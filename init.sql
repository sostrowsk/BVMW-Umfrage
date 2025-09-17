-- Core Tables for Survey Platform MVP

-- Using pgcrypto for gen_random_uuid() if not built-in
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    size_category VARCHAR(50),
    industry VARCHAR(100),
    membership_start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(100),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(10),
    config JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'planned',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_responses INTEGER,
    created_by UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    answers JSONB NOT NULL,
    impact_score INTEGER,
    meta JSONB
);

-- Survey invitations table for anonymous and personalized links
CREATE TABLE survey_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    invitation_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_responses_member_id ON survey_responses(member_id);
CREATE INDEX idx_responses_completed ON survey_responses(completed_at);
CREATE INDEX idx_invitations_token_hash ON survey_invitations(token_hash);
CREATE INDEX idx_invitations_survey_id ON survey_invitations(survey_id);
CREATE INDEX idx_invitations_member_id ON survey_invitations(member_id);

-- Note: The survey_analytics table is excluded from the MVP as planned.
-- I've used TIMESTAMP WITH TIME ZONE for better timezone handling and added some ON DELETE clauses for data integrity.
