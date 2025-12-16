-- Simple378 Fraud Detection Database Schema
-- SQLite/SQLCipher Version - Migrated from PostgreSQL
-- Generated: 2025-12-08

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK(role IN ('analyst', 'senior_analyst', 'investigator', 'manager', 'admin')),
    department TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT,
    preferences TEXT -- JSON stored as TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- Cases Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('draft', 'open', 'investigating', 'pending_review', 'escalated', 'closed_approved', 'closed_denied', 'closed_no_action')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    case_type TEXT NOT NULL DEFAULT 'fraud_suspected' CHECK(case_type IN ('fraud_suspected', 'identity_theft', 'account_takeover', 'money_laundering', 'structuring', 'synthetic_id', 'other')),

    -- Assignment and ownership
    assignee_id TEXT,
    assigned_by TEXT,
    assigned_at TEXT,
    team_id TEXT,

    -- Risk and scoring
    risk_score REAL DEFAULT 0.0,
    risk_level TEXT DEFAULT 'low',
    fraud_amount REAL DEFAULT 0.0,
    potential_loss REAL DEFAULT 0.0,

    -- Customer/Account information
    customer_id TEXT,
    account_id TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,

    -- Case metadata
    tags TEXT, -- JSON array stored as TEXT
    custom_fields TEXT, -- JSON stored as TEXT

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    due_date TEXT,

    -- Audit and compliance
    created_by TEXT,
    closed_by TEXT,
    last_reviewed_by TEXT,
    last_reviewed_at TEXT,

    -- Integration and sync
    external_id TEXT,
    is_synced INTEGER DEFAULT 0,
    sync_metadata TEXT -- JSON stored as TEXT
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_assignee ON cases(assignee_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_risk_score ON cases(risk_score);
CREATE INDEX IF NOT EXISTS idx_cases_customer_id ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_due_date ON cases(due_date);
CREATE INDEX IF NOT EXISTS idx_cases_fraud_amount ON cases(fraud_amount);
CREATE INDEX IF NOT EXISTS idx_cases_external_id ON cases(external_id);
CREATE INDEX IF NOT EXISTS idx_cases_is_synced ON cases(is_synced);

-- ============================================================================
-- Evidence Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    transaction_id TEXT REFERENCES transactions(id),

    -- File information
    filename TEXT,
    original_filename TEXT,
    file_path TEXT,
    file_type TEXT,
    file_category TEXT,
    size_bytes INTEGER,

    -- Upload and processing
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    uploaded_by TEXT,
    processed_at TEXT,
    processing_status TEXT DEFAULT 'pending',

    -- Content analysis
    hash TEXT,
    ocr_text TEXT,
    extracted_text TEXT,
    key_entities TEXT, -- JSON stored as TEXT
    sentiment_score REAL,

    -- Evidence quality and admissibility
    is_admissible INTEGER DEFAULT 1,
    admissibility_reason TEXT,
    quality_score REAL DEFAULT 0.0,
    relevance_score REAL DEFAULT 0.0,

    -- Metadata
    evidence_metadata TEXT, -- JSON stored as TEXT
    tags TEXT -- JSON stored as TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_filename ON evidence(filename);
CREATE INDEX IF NOT EXISTS idx_evidence_file_type ON evidence(file_type);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_at ON evidence(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_processing_status ON evidence(processing_status);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence(hash);
CREATE INDEX IF NOT EXISTS idx_evidence_quality_score ON evidence(quality_score);
CREATE INDEX IF NOT EXISTS idx_evidence_relevance_score ON evidence(relevance_score);
CREATE INDEX IF NOT EXISTS idx_evidence_is_admissible ON evidence(is_admissible);

-- ============================================================================
-- Transactions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    external_transaction_id TEXT,

    -- Transaction details
    date TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    merchant_name TEXT,
    merchant_category TEXT,
    transaction_type TEXT,

    -- Location and device information
    country TEXT,
    city TEXT,
    ip_address TEXT,
    device_fingerprint TEXT,
    user_agent TEXT,

    -- Risk and analysis
    risk_score REAL DEFAULT 0.0,
    is_flagged INTEGER DEFAULT 0,
    flag_reason TEXT,

    -- Status and workflow
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,

    -- Metadata
    transaction_metadata TEXT, -- JSON stored as TEXT
    analysis_results TEXT -- JSON stored as TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_case_id ON transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_score ON transactions(risk_score);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_country ON transactions(country);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_flagged ON transactions(is_flagged);

-- ============================================================================
-- Case Notes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_notes (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    author_id TEXT,
    author_name TEXT,
    content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',
    is_internal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created_at ON case_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_case_notes_note_type ON case_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_case_notes_is_internal ON case_notes(is_internal);

-- ============================================================================
-- Case Activities Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_activities (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    user_id TEXT,
    user_name TEXT,
    activity_type TEXT,
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    activity_metadata TEXT, -- JSON stored as TEXT
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON case_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activities_timestamp ON case_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_case_activities_activity_type ON case_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_case_activities_user_id ON case_activities(user_id);

-- ============================================================================
-- Teams Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    lead_id TEXT,
    department TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

-- ============================================================================
-- Entities Table (People, Companies, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('person', 'company', 'account', 'card', 'device', 'ip', 'other')),
    name TEXT NOT NULL,
    identifier TEXT, -- SSN, EIN, Account Number, etc.
    email TEXT,
    phone TEXT,
    address TEXT,
    metadata TEXT, -- JSON stored as TEXT
    risk_score REAL CHECK(risk_score >= 0 AND risk_score <= 100),
    is_flagged INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS idx_entities_identifier ON entities(identifier);
CREATE INDEX IF NOT EXISTS idx_entities_flagged ON entities(is_flagged);

-- ============================================================================
-- Case Entities Junction Table (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type TEXT, -- 'suspect', 'victim', 'witness', 'related'
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(case_id, entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_case_entities_case ON case_entities(case_id);
CREATE INDEX IF NOT EXISTS idx_case_entities_entity ON case_entities(entity_id);

-- ============================================================================
-- Audit Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    changes TEXT, -- JSON stored as TEXT
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);

-- ============================================================================
-- Full-Text Search (FTS5)
-- ============================================================================

-- Evidence full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS evidence_fts USING fts5(
    filename,
    original_filename,
    extracted_text,
    content=evidence,
    content_rowid=id
);

-- Triggers to keep FTS in sync with evidence table
CREATE TRIGGER IF NOT EXISTS evidence_fts_insert AFTER INSERT ON evidence BEGIN
    INSERT INTO evidence_fts(rowid, filename, original_filename, extracted_text)
    VALUES (new.id, new.filename, new.original_filename, new.extracted_text);
END;

CREATE TRIGGER IF NOT EXISTS evidence_fts_update AFTER UPDATE ON evidence BEGIN
    UPDATE evidence_fts SET
        filename = new.filename,
        original_filename = new.original_filename,
        extracted_text = new.extracted_text
    WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS evidence_fts_delete AFTER DELETE ON evidence BEGIN
    DELETE FROM evidence_fts WHERE rowid = old.id;
END;

-- Cases full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS cases_fts USING fts5(
    title,
    description,
    case_number,
    content=cases,
    content_rowid=id
);

-- Triggers to keep FTS in sync with cases table
CREATE TRIGGER IF NOT EXISTS cases_fts_insert AFTER INSERT ON cases BEGIN
    INSERT INTO cases_fts(rowid, title, description, case_number)
    VALUES (new.id, new.title, new.description, new.case_number);
END;

CREATE TRIGGER IF NOT EXISTS cases_fts_update AFTER UPDATE ON cases BEGIN
    UPDATE cases_fts SET
        title = new.title,
        description = new.description,
        case_number = new.case_number
    WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS cases_fts_delete AFTER DELETE ON cases BEGIN
    DELETE FROM cases_fts WHERE rowid = old.id;
END;
