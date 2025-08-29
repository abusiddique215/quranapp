/**
 * API Client Main Export
 * Central export for all API clients and utilities
 */

// Core clients
export { quranClient } from './quran-client';
export { prayerClient, LocationService } from './prayer-client';
export { cacheManager } from './cache';

// Base classes and utilities
export { BaseAPIClient, APIError } from './base';
export { CacheManager } from './cache';

// Configuration
export * from './config';

// Re-export the existing function for backward compatibility
export { getSampleAyahPair } from './quran';

// Convenience exports for common operations
export * from './services';