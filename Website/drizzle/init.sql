-- Extensions for fuzzy Arabic trigram matching and accent removal
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_doctor BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Items Table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_normalized VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'medication')),
    image_url VARCHAR(255),
    hemolysis_votes INTEGER NOT NULL DEFAULT 0,
    safe_votes INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Votes Table (Strict UNIQUE constraint per user_id, item_id)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    vote_type VARCHAR(15) NOT NULL CHECK (vote_type IN ('hemolysis', 'safe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_item_vote UNIQUE (user_id, item_id)
);

-- 4. Reports Table for Spam Prevention and Moderation (§10)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_item_report UNIQUE (user_id, item_id)
);

-- Indexes for ultra-fast lookup and GIN trigram text search
CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON items USING gin (name_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_items_category_votes ON items (category, total_votes DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_item ON votes (item_id);
