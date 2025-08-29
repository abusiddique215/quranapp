-- Quran Database Schema for Complete Local Storage
-- Designed for OP-SQLite with 6236 verses, Islamic accuracy, and performance
-- Created: 2025 Database-First Architecture

-- Enable foreign key constraints and performance optimizations
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;

-- Create indexes for optimal query performance
-- These will be created after table creation

-- =============================================================================
-- SURAHS TABLE - Complete chapter metadata
-- =============================================================================
CREATE TABLE surahs (
    id INTEGER PRIMARY KEY,                    -- Surah number (1-114)
    name_arabic TEXT NOT NULL,                 -- Arabic name: "البقرة"
    name_english TEXT NOT NULL,                -- English name: "Al-Baqarah"
    name_transliteration TEXT NOT NULL,        -- "Al-Baqarah"
    verse_count INTEGER NOT NULL,              -- Total verses in surah
    revelation_order INTEGER NOT NULL,         -- Chronological revelation order
    revelation_type TEXT NOT NULL CHECK(revelation_type IN ('meccan', 'medinan')),
    page_start INTEGER,                        -- Mushaf page number where surah starts
    juz_start INTEGER,                         -- Juz (part) where surah starts
    has_bismillah BOOLEAN NOT NULL DEFAULT 1, -- False only for At-Tawbah (9)
    huroof_muqattaat TEXT,                     -- Mysterious letters if present: "الم", "يس", etc.
    description_english TEXT,                  -- Brief description in English
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- VERSES TABLE - All 6236 verses with complete text
-- =============================================================================
CREATE TABLE verses (
    id INTEGER PRIMARY KEY,                    -- Global verse ID (1-6236)
    surah_id INTEGER NOT NULL,                 -- References surahs.id
    verse_number INTEGER NOT NULL,             -- Verse number within surah
    text_arabic TEXT NOT NULL,                 -- Arabic text (cleaned, no Bismillah contamination)
    text_english TEXT NOT NULL,                -- English translation
    text_transliteration TEXT NOT NULL,        -- Phonetic transliteration
    juz INTEGER NOT NULL,                      -- Juz (part) number
    hizb INTEGER,                             -- Hizb (half-juz) number
    page INTEGER NOT NULL,                     -- Mushaf page number
    sajda_type TEXT CHECK(sajda_type IN ('recommended', 'obligatory')), -- Prostration type
    revelation_order INTEGER,                 -- Global chronological order
    word_count INTEGER,                       -- Number of words in Arabic
    letter_count INTEGER,                     -- Number of letters in Arabic
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (surah_id) REFERENCES surahs(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    UNIQUE(surah_id, verse_number)
);

-- =============================================================================
-- TRANSLATIONS TABLE - Multiple translation support for future
-- =============================================================================
CREATE TABLE translations (
    id INTEGER PRIMARY KEY,
    verse_id INTEGER NOT NULL,
    translator_name TEXT NOT NULL,             -- "Sahih International", "Pickthall", etc.
    translator_language TEXT NOT NULL DEFAULT 'en',
    text TEXT NOT NULL,                       -- Translation text
    footnote TEXT,                            -- Optional footnote
    is_default BOOLEAN NOT NULL DEFAULT 0,    -- Mark default translation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE,
    
    -- Unique constraint per verse/translator
    UNIQUE(verse_id, translator_name, translator_language)
);

-- =============================================================================
-- WORD_ROOTS TABLE - Arabic root words for search (future enhancement)
-- =============================================================================
CREATE TABLE word_roots (
    id INTEGER PRIMARY KEY,
    root_arabic TEXT NOT NULL UNIQUE,         -- Arabic root: "ك ت ب"
    root_transliteration TEXT NOT NULL,       -- "k-t-b"
    meaning_english TEXT NOT NULL,            -- "to write"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- VERSE_WORDS TABLE - Individual words for advanced search (future)
-- =============================================================================
CREATE TABLE verse_words (
    id INTEGER PRIMARY KEY,
    verse_id INTEGER NOT NULL,
    word_position INTEGER NOT NULL,           -- Position in verse (1-based)
    word_arabic TEXT NOT NULL,                -- Arabic word
    word_transliteration TEXT NOT NULL,       -- Transliterated word
    root_id INTEGER,                          -- References word_roots.id
    grammar_info TEXT,                        -- Grammatical information (JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE,
    FOREIGN KEY (root_id) REFERENCES word_roots(id),
    
    -- Unique constraint
    UNIQUE(verse_id, word_position)
);

-- =============================================================================
-- USER PREFERENCES TABLE - Reading settings and progress
-- =============================================================================
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id TEXT,                             -- Clerk user ID (nullable for guest)
    preference_key TEXT NOT NULL,             -- "font_size", "translation_visible", etc.
    preference_value TEXT NOT NULL,           -- JSON serialized value
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint per user/key
    UNIQUE(user_id, preference_key)
);

-- =============================================================================
-- READING_SESSIONS TABLE - Track reading progress
-- =============================================================================
CREATE TABLE reading_sessions (
    id INTEGER PRIMARY KEY,
    user_id TEXT,                             -- Clerk user ID (nullable for guest)
    surah_id INTEGER NOT NULL,
    verse_id INTEGER NOT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    total_time_seconds INTEGER DEFAULT 0,     -- Reading time in seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (surah_id) REFERENCES surahs(id),
    FOREIGN KEY (verse_id) REFERENCES verses(id)
);

-- =============================================================================
-- BOOKMARKS TABLE - User bookmarks and notes
-- =============================================================================
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY,
    user_id TEXT,                             -- Clerk user ID (nullable for guest)
    verse_id INTEGER NOT NULL,
    note TEXT,                                -- User's personal note
    tags TEXT,                                -- Comma-separated tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE,
    
    -- Unique constraint per user/verse
    UNIQUE(user_id, verse_id)
);

-- =============================================================================
-- SEARCH_INDEX TABLE - FTS5 full-text search (when enabled)
-- =============================================================================
-- This will be created separately when FTS5 is enabled in package.json
-- CREATE VIRTUAL TABLE search_index USING fts5(
--     content,
--     surah_name,
--     verse_arabic,
--     verse_english,
--     verse_transliteration,
--     content='verses',
--     content_rowid='id'
-- );

-- =============================================================================
-- PERFORMANCE INDEXES - Optimized for app queries
-- =============================================================================

-- Primary lookup indexes
CREATE INDEX idx_verses_surah_verse ON verses(surah_id, verse_number);
CREATE INDEX idx_verses_surah_id ON verses(surah_id);
CREATE INDEX idx_verses_juz ON verses(juz);
CREATE INDEX idx_verses_page ON verses(page);

-- Translation indexes
CREATE INDEX idx_translations_verse_id ON translations(verse_id);
CREATE INDEX idx_translations_default ON translations(is_default, translator_language);

-- User data indexes
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id, preference_key);
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id, surah_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- Performance indexes for complex queries
CREATE INDEX idx_verses_revelation_order ON verses(revelation_order);
CREATE INDEX idx_surahs_revelation_order ON surahs(revelation_order);

-- =============================================================================
-- VIEWS for common queries
-- =============================================================================

-- Complete verse view with surah information
CREATE VIEW verse_complete AS
SELECT 
    v.id,
    v.surah_id,
    v.verse_number,
    v.text_arabic,
    v.text_english,
    v.text_transliteration,
    v.juz,
    v.page,
    s.name_arabic as surah_name_arabic,
    s.name_english as surah_name_english,
    s.name_transliteration as surah_name_transliteration,
    s.huroof_muqattaat,
    s.has_bismillah
FROM verses v
JOIN surahs s ON v.surah_id = s.id;

-- Surah summary view
CREATE VIEW surah_summary AS
SELECT 
    s.*,
    COUNT(v.id) as actual_verse_count,
    MIN(v.page) as first_page,
    MAX(v.page) as last_page
FROM surahs s
LEFT JOIN verses v ON s.id = v.surah_id
GROUP BY s.id;

-- =============================================================================
-- TRIGGERS for updated_at timestamps
-- =============================================================================

-- Update surahs.updated_at
CREATE TRIGGER update_surahs_timestamp 
    AFTER UPDATE ON surahs
    FOR EACH ROW
    BEGIN
        UPDATE surahs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update verses.updated_at
CREATE TRIGGER update_verses_timestamp 
    AFTER UPDATE ON verses
    FOR EACH ROW
    BEGIN
        UPDATE verses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update user_preferences.updated_at
CREATE TRIGGER update_user_preferences_timestamp 
    AFTER UPDATE ON user_preferences
    FOR EACH ROW
    BEGIN
        UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update bookmarks.updated_at
CREATE TRIGGER update_bookmarks_timestamp 
    AFTER UPDATE ON bookmarks
    FOR EACH ROW
    BEGIN
        UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- =============================================================================
-- SAMPLE DATA POPULATION QUERIES (for reference)
-- =============================================================================

-- Example surah insertion (Al-Fatihah)
/*
INSERT INTO surahs (id, name_arabic, name_english, name_transliteration, verse_count, revelation_order, revelation_type, page_start, juz_start, has_bismillah, huroof_muqattaat, description_english) 
VALUES (1, 'الفاتحة', 'Al-Fatihah', 'Al-Fatihah', 7, 1, 'meccan', 1, 1, 1, NULL, 'The Opening');

-- Example verse insertion
INSERT INTO verses (id, surah_id, verse_number, text_arabic, text_english, text_transliteration, juz, page) 
VALUES (1, 1, 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', 'Bismillahi r-rahmani r-rahim', 1, 1);
*/