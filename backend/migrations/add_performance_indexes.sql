-- Performance Optimization: Database Indexes (Updated for Actual Schema)
-- Created: 2025-12-19
-- Purpose: Add indexes for frequently queried columns that actually exist in the database

-- ===========================================
-- CASES TABLE INDEXES
-- ===========================================

-- Status-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- Risk level filtering
CREATE INDEX IF NOT EXISTS idx_cases_risk_level ON cases(risk_level);

-- Chronological sorting (cases list, dashboards)
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- Assignment queries
CREATE INDEX IF NOT EXISTS idx_cases_assignee_id ON cases(assignee_id);

-- Team-based queries
CREATE INDEX IF NOT EXISTS idx_cases_team_id ON cases(team_id);

-- Composite index for common query pattern (status + risk_level combo)
CREATE INDEX IF NOT EXISTS idx_cases_status_risk ON cases(status, risk_level);

-- Customer lookups
CREATE INDEX IF NOT EXISTS idx_cases_customer_id ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_account_id ON cases(account_id);


-- ===========================================
-- EVIDENCE TABLE INDEXES (if table exists)
-- ===========================================

-- Case-based evidence retrieval
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);

--Chronological sorting
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at DESC);


-- ===========================================
-- FRAUD RULES TABLE INDEXES (if exists)
-- ===========================================

-- Rule type and enabled status
CREATE INDEX IF NOT EXISTS idx_fraud_rules_enabled ON fraud_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_rule_type ON fraud_rules(rule_type);


-- ===========================================
-- USERS TABLE INDEXES
-- ===========================================

-- Email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);


-- ===========================================
-- VERIFICATION
-- ===========================================

-- Verify index creation
SELECT name, sql FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;
