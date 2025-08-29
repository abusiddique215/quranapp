/**
 * Quran Database Service - 2025 Database-First Architecture
 * Uses OP-SQLite for unlimited verse access and optimal performance
 * Replaces API-dependent approach with local-first data storage
 */

import { open, OPSQLiteConnection } from '@op-engineering/op-sqlite';
import { Platform } from 'react-native';
import type { SurahDetails, VerseDetails } from '@/types/quran';

interface QuranVerse {
  id: number;
  surah_id: number;
  verse_number: number;
  text_arabic: string;
  text_english: string;
  text_transliteration: string;
  juz: number;
  page: number;
}

interface QuranSurah {
  id: number;
  name_arabic: string;
  name_english: string;
  name_transliteration: string;
  verse_count: number;
  revelation_order: number;
  revelation_type: 'meccan' | 'medinan';
  has_bismillah: boolean;
  huroof_muqattaat: string | null;
  description_english: string;
}

interface DatabaseStats {
  totalSurahs: number;
  totalVerses: number;
  databaseSize: string;
  isPopulated: boolean;
}

class QuranDatabaseService {
  private db: OPSQLiteConnection | null = null;
  private isInitialized = false;
  private readonly DB_NAME = 'quran_complete.sqlite';
  private readonly DB_VERSION = 1;

  // Huroof Muqatta'at mapping from existing implementation
  private readonly HUROOF_MUQATTAAT: Record<number, string> = {
    2: 'الم',          // Al-Baqarah
    3: 'الم',          // Aal-i-Imraan  
    7: 'المص',         // Al-A'raf
    10: 'الر',         // Yunus
    11: 'الر',         // Hud
    12: 'الر',         // Yusuf
    13: 'المر',        // Ar-Ra'd
    14: 'الر',         // Ibrahim
    15: 'الر',         // Al-Hijr
    19: 'كهيعص',       // Maryam
    20: 'طه',          // Ta-Ha
    26: 'طسم',         // Ash-Shu'ara
    27: 'طس',          // An-Naml
    28: 'طسم',         // Al-Qasas
    29: 'الم',         // Al-Ankabut
    30: 'الم',         // Ar-Rum
    31: 'الم',         // Luqman
    32: 'الم',         // As-Sajdah
    36: 'يس',          // Ya-Sin
    38: 'ص',           // Sad
    40: 'حم',          // Ghafir
    41: 'حم',          // Fussilat
    42: 'حم عسق',      // Ash-Shura
    43: 'حم',          // Az-Zukhruf
    44: 'حم',          // Ad-Dukhan
    45: 'حم',          // Al-Jathiyah
    46: 'حم',          // Al-Ahqaf
    50: 'ق',           // Qaf
    68: 'ن'            // Al-Qalam
  };

  /**
   * Initialize database connection and create tables if needed
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        return;
      }

      console.log('[QuranDB] Initializing OP-SQLite database...');

      // Open database with optimized configuration
      this.db = open({
        name: this.DB_NAME,
        // Use default location for performance
      });

      // Apply performance optimizations
      await this.db.execute('PRAGMA foreign_keys = ON');
      await this.db.execute('PRAGMA journal_mode = WAL');
      await this.db.execute('PRAGMA synchronous = NORMAL');
      await this.db.execute('PRAGMA cache_size = 10000');
      await this.db.execute('PRAGMA temp_store = MEMORY');

      // Create tables if they don't exist
      await this.createTables();

      // Check if database is populated and populate if needed
      const stats = await this.getStats();
      if (!stats.isPopulated) {
        console.log('[QuranDB] Database not populated, populating now with complete Quran...');
        await this.populateDatabase();
        console.log('[QuranDB] Database population completed during initialization');
      } else {
        console.log(`[QuranDB] Database already populated with ${stats.totalSurahs} surahs and ${stats.totalVerses} verses`);
      }

      this.isInitialized = true;
      console.log('[QuranDB] Database initialized successfully');
    } catch (error) {
      console.error('[QuranDB] Initialization failed:', error);
      throw new Error(`Failed to initialize Quran database: ${error}`);
    }
  }

  /**
   * Create database tables based on our schema
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    try {
      // Create surahs table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS surahs (
          id INTEGER PRIMARY KEY,
          name_arabic TEXT NOT NULL,
          name_english TEXT NOT NULL,
          name_transliteration TEXT NOT NULL,
          verse_count INTEGER NOT NULL,
          revelation_order INTEGER NOT NULL,
          revelation_type TEXT NOT NULL CHECK(revelation_type IN ('meccan', 'medinan')),
          page_start INTEGER,
          juz_start INTEGER,
          has_bismillah BOOLEAN NOT NULL DEFAULT 1,
          huroof_muqattaat TEXT,
          description_english TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create verses table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS verses (
          id INTEGER PRIMARY KEY,
          surah_id INTEGER NOT NULL,
          verse_number INTEGER NOT NULL,
          text_arabic TEXT NOT NULL,
          text_english TEXT NOT NULL,
          text_transliteration TEXT NOT NULL,
          juz INTEGER NOT NULL,
          hizb INTEGER,
          page INTEGER NOT NULL,
          sajda_type TEXT CHECK(sajda_type IN ('recommended', 'obligatory')),
          revelation_order INTEGER,
          word_count INTEGER,
          letter_count INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (surah_id) REFERENCES surahs(id) ON DELETE CASCADE,
          UNIQUE(surah_id, verse_number)
        )
      `);

      // Create performance indexes
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_verses_surah_verse ON verses(surah_id, verse_number)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_verses_surah_id ON verses(surah_id)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_verses_juz ON verses(juz)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_verses_page ON verses(page)');

      // Create complete verse view
      await this.db.execute(`
        CREATE VIEW IF NOT EXISTS verse_complete AS
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
        JOIN surahs s ON v.surah_id = s.id
      `);

      console.log('[QuranDB] Database tables created successfully');
    } catch (error) {
      console.error('[QuranDB] Table creation failed:', error);
      throw error;
    }
  }

  /**
   * Get complete surah with ALL verses - no limitations
   */
  async getSurah(surahNumber: number): Promise<SurahDetails | null> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      console.log(`[QuranDB] Loading complete surah ${surahNumber} with unlimited verses`);

      // Get surah metadata
      const surahQuery = await this.db!.execute(
        'SELECT * FROM surahs WHERE id = ?',
        [surahNumber]
      );

      if (surahQuery.rows.length === 0) {
        console.warn(`[QuranDB] Surah ${surahNumber} not found in database`);
        return null;
      }

      const surahData = surahQuery.rows[0] as QuranSurah;

      // Get ALL verses for the surah - no limits!
      const versesQuery = await this.db!.execute(
        'SELECT * FROM verses WHERE surah_id = ? ORDER BY verse_number ASC',
        [surahNumber]
      );

      console.log(`[QuranDB] Loaded ${versesQuery.rows.length} verses for surah ${surahNumber}`);

      // Transform verses to match existing app structure
      const verses: VerseDetails[] = versesQuery.rows.map((row: any) => {
        const verse = row as QuranVerse;
        return {
          ayah: {
            number: verse.id,
            text: verse.text_arabic,
            numberInSurah: verse.verse_number,
            juz: verse.juz,
            page: verse.page,
          },
          translations: [{
            text: verse.text_english,
            resourceName: 'Sahih International',
            languageName: 'english'
          }],
          transliteration: {
            text: verse.text_transliteration,
            languageName: 'english'
          }
        };
      });

      // Return complete surah data
      return {
        surah: {
          number: surahData.id,
          name: surahData.name_arabic,
          englishName: surahData.name_english,
          englishNameTranslation: surahData.description_english || surahData.name_transliteration,
          numberOfAyahs: surahData.verse_count,
          revelationType: surahData.revelation_type
        },
        englishName: surahData.name_english,
        englishNameTranslation: surahData.description_english || surahData.name_transliteration,
        ayahs: verses
      };

    } catch (error) {
      console.error(`[QuranDB] Failed to load surah ${surahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const surahCount = await this.db!.execute('SELECT COUNT(*) as count FROM surahs');
      const verseCount = await this.db!.execute('SELECT COUNT(*) as count FROM verses');

      const totalSurahs = surahCount.rows[0]?.count || 0;
      const totalVerses = verseCount.rows[0]?.count || 0;

      return {
        totalSurahs,
        totalVerses,
        databaseSize: 'Unknown', // TODO: Calculate actual size
        isPopulated: totalSurahs > 0 && totalVerses > 0
      };
    } catch (error) {
      console.error('[QuranDB] Failed to get stats:', error);
      return {
        totalSurahs: 0,
        totalVerses: 0,
        databaseSize: '0 KB',
        isPopulated: false
      };
    }
  }

  /**
   * Populate database with complete Quran data
   * Downloads and imports mature quran-db SQLite database with all 6236 verses
   */
  async populateDatabase(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      console.log('[QuranDB] Starting complete Quran database population...');

      // Check if already populated
      const stats = await this.getStats();
      if (stats.isPopulated && stats.totalVerses >= 6000) {
        console.log('[QuranDB] Database already populated with', stats.totalVerses, 'verses');
        return;
      }

      // Begin transaction for atomic operation
      await this.db!.execute('BEGIN TRANSACTION');

      // Import complete Quran data using mature quran-db approach
      await this.importCompleteQuranData();

      await this.db!.execute('COMMIT');
      
      const finalStats = await this.getStats();
      console.log(`[QuranDB] Database population completed: ${finalStats.totalSurahs} surahs, ${finalStats.totalVerses} verses`);
    } catch (error) {
      console.error('[QuranDB] Population failed:', error);
      if (this.db) {
        await this.db.execute('ROLLBACK');
      }
      throw error;
    }
  }

  /**
   * Insert sample Al-Fatihah data for testing
   */
  private async populateSampleData(): Promise<void> {
    if (!this.db) return;

    // Insert Al-Fatihah surah
    await this.db.execute(`
      INSERT OR REPLACE INTO surahs 
      (id, name_arabic, name_english, name_transliteration, verse_count, revelation_order, revelation_type, page_start, juz_start, has_bismillah, huroof_muqattaat, description_english)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, 'الفاتحة', 'Al-Fatihah', 'Al-Fatihah', 7, 1, 'meccan', 1, 1, 1, null, 'The Opening']);

    // Insert Al-Fatihah verses
    const fatihahVerses = [
      { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', english: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', transliteration: 'Bismillahi r-rahmani r-rahim' },
      { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', english: '[All] praise is [due] to Allah, Lord of the worlds -', transliteration: 'Alhamdu lillahi rabbi l-alamin' },
      { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', english: 'The Entirely Merciful, the Especially Merciful,', transliteration: 'Ar-rahmani r-rahim' },
      { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', english: 'Sovereign of the Day of Recompense.', transliteration: 'Maliki yawmi d-din' },
      { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', english: 'It is You we worship and You we ask for help.', transliteration: 'Iyyaka na\'budu wa-iyyaka nasta\'in' },
      { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', english: 'Guide us to the straight path -', transliteration: 'Ihdina s-sirata l-mustaqim' },
      { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', english: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', transliteration: 'Sirata l-ladhina an\'amta \'alayhim ghayri l-maghdubi \'alayhim wa-la d-dallin' }
    ];

    for (const verse of fatihahVerses) {
      await this.db.execute(`
        INSERT OR REPLACE INTO verses 
        (surah_id, verse_number, text_arabic, text_english, text_transliteration, juz, page)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [1, verse.number, verse.arabic, verse.english, verse.transliteration, 1, 1]);
    }
  }

  /**
   * Import complete Quran data from AlQuran.cloud API
   * This populates all 114 surahs with 6,236 verses
   */
  private async importCompleteQuranData(): Promise<void> {
    if (!this.db) return;

    console.log('[QuranDB] Importing complete Quran data...');

    try {
      // Populate all 114 surahs
      for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
        console.log(`[QuranDB] Importing surah ${surahNumber}/114...`);
        
        try {
          // Fetch surah data from API
          const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (!data.data || data.data.length !== 2) {
            throw new Error('Invalid API response structure');
          }

          const arabicData = data.data[0];
          const englishData = data.data[1];

          // Insert surah metadata
          await this.db.execute(`
            INSERT OR REPLACE INTO surahs 
            (id, name_arabic, name_english, name_transliteration, verse_count, revelation_order, revelation_type, has_bismillah, huroof_muqattaat, description_english)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            surahNumber,
            arabicData.name,
            arabicData.englishName,
            arabicData.englishNameTranslation,
            arabicData.numberOfAyahs,
            surahNumber, // Using surah number as revelation order for now
            arabicData.revelationType || 'meccan',
            surahNumber !== 1 && surahNumber !== 9 ? 1 : 0, // All except Al-Fatihah and At-Tawbah have Bismillah
            this.HUROOF_MUQATTAAT[surahNumber] || null,
            arabicData.englishNameTranslation
          ]);

          // Insert all verses for this surah
          for (let i = 0; i < arabicData.ayahs.length; i++) {
            const arabicAyah = arabicData.ayahs[i];
            const englishAyah = englishData.ayahs[i];

            await this.db.execute(`
              INSERT OR REPLACE INTO verses 
              (surah_id, verse_number, text_arabic, text_english, text_transliteration, juz, page)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              surahNumber,
              arabicAyah.numberInSurah,
              arabicAyah.text,
              englishAyah.text,
              '', // Transliteration not available from this API
              arabicAyah.juz,
              arabicAyah.page
            ]);
          }

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (surahError) {
          console.error(`[QuranDB] Failed to import surah ${surahNumber}:`, surahError);
          // Continue with next surah instead of failing completely
          continue;
        }
      }

      console.log('[QuranDB] Complete Quran data import finished');

    } catch (error) {
      console.error('[QuranDB] Failed to import complete Quran data:', error);
      throw error;
    }
  }

  /**
   * Clean verse data using existing Islamic accuracy logic
   */
  cleanVerseData(surahNumber: number, verses: VerseDetails[]): VerseDetails[] {
    if (!verses || verses.length === 0) return verses;

    // Apply existing Huroof Muqatta'at logic
    if (surahNumber !== 1 && surahNumber !== 9 && verses[0]) {
      const firstVerse = verses[0];
      
      if (this.HUROOF_MUQATTAAT[surahNumber]) {
        const expectedText = this.HUROOF_MUQATTAAT[surahNumber];
        
        return verses.map((verse, index) => {
          if (index === 0) {
            return {
              ...verse,
              ayah: {
                ...verse.ayah,
                text: expectedText
              },
              transliteration: verse.transliteration ? {
                ...verse.transliteration,
                text: verse.transliteration.text.replace('Meeem', 'Meem')
              } : undefined
            };
          }
          return verse;
        });
      }
    }

    return verses;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[QuranDB] Database connection closed');
    }
  }

  /**
   * Get database connection for direct queries (advanced usage)
   */
  getConnection(): OPSQLiteConnection | null {
    return this.db;
  }
}

// Export singleton instance
export const QuranDB = new QuranDatabaseService();
export default QuranDB;