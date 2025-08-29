-- Database Population Strategy for Quran App
-- This script demonstrates the approach to populate the database with complete Quran data

-- 1. Download mature quran-db SQLite database
-- curl -L -o src/assets/database/quran.sqlite "https://github.com/youzarsiph/quran-db/raw/main/quran.sqlite"

-- 2. Alternative: Use API to populate database programmatically
-- Replace populateSampleData() with full population logic

-- Verification queries after population:
SELECT COUNT(*) as total_verses FROM verses; -- Should be 6236
SELECT COUNT(*) as total_surahs FROM surahs; -- Should be 114
SELECT surah_id, COUNT(*) as verse_count FROM verses GROUP BY surah_id ORDER BY surah_id LIMIT 5;

-- Performance verification:
EXPLAIN QUERY PLAN SELECT * FROM verses WHERE surah_id = 2; -- Should use index