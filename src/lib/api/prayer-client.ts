/**
 * Prayer Times API Client
 * Integration with Aladhan API for location-based prayer times
 */

import { BaseAPIClient, APIError } from './base';
import { cacheManager } from './cache';
import { PRAYER_CONFIG, CALCULATION_METHODS, OFFLINE_CONFIG, FEATURE_FLAGS } from './config';
import type {
  PrayerTimes,
  PrayerTimesData,
  LocationData,
  PrayerApiResponse,
  PrayerTime,
} from '@/types/quran';

/**
 * Location service for getting user coordinates
 */
export class LocationService {
  /**
   * Get current location using device GPS
   */
  static async getCurrentLocation(): Promise<LocationData | null> {
    if (!FEATURE_FLAGS.enableLocationServices) {
      return null;
    }

    try {
      // For React Native, we would use expo-location
      // For now, we'll simulate or use a fallback
      return OFFLINE_CONFIG.defaultLocation;
    } catch (error) {
      console.warn('Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Get location by city name
   */
  static async getLocationByCity(city: string, country?: string): Promise<LocationData | null> {
    const cacheKey = `location_${city}_${country || 'unknown'}`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<LocationData>('location', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // In a real implementation, you might use a geocoding service
      // For now, we'll return default location
      const location = OFFLINE_CONFIG.defaultLocation;
      
      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('location', cacheKey, location);
      }

      return location;
    } catch (error) {
      console.warn('Failed to get location by city:', error);
      return null;
    }
  }
}

/**
 * Prayer Times API client with location handling and caching
 */
export class PrayerTimesAPIClient extends BaseAPIClient {
  private defaultMethod: number;
  private defaultSchool: number;

  constructor() {
    super(PRAYER_CONFIG.baseUrl, PRAYER_CONFIG.timeout, PRAYER_CONFIG.retryAttempts);
    this.defaultMethod = PRAYER_CONFIG.method;
    this.defaultSchool = PRAYER_CONFIG.school;
  }

  /**
   * Get prayer times for current location and date
   */
  async getPrayerTimes(location?: LocationData, date?: Date): Promise<PrayerTimesData> {
    const targetDate = date || new Date();
    const targetLocation = location || await LocationService.getCurrentLocation() || OFFLINE_CONFIG.defaultLocation;
    
    const dateStr = this.formatDate(targetDate);
    const locationStr = `${targetLocation.latitude}_${targetLocation.longitude}`;
    const cacheKey = `prayer_times_${locationStr}_${dateStr}_${this.defaultMethod}`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<PrayerTimesData>('prayer', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const endpoint = `timings/${dateStr}?latitude=${targetLocation.latitude}&longitude=${targetLocation.longitude}&method=${this.defaultMethod}&school=${this.defaultSchool}`;
      
      const response = await this.get<PrayerApiResponse<PrayerTimesData>>(`times/${endpoint}`);
      
      // Transform the response to match our interface
      const prayerData = this.transformPrayerResponse(response.data, targetLocation);

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('prayer', cacheKey, prayerData);
      }

      return prayerData;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        return this.getPrayerTimesFromBackup(targetLocation, targetDate);
      }
      throw error;
    }
  }

  /**
   * Get prayer times by city name
   */
  async getPrayerTimesByCity(city: string, country?: string, date?: Date): Promise<PrayerTimesData> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);
    const cacheKey = `prayer_times_city_${city}_${country || 'unknown'}_${dateStr}_${this.defaultMethod}`;
    
    // Try cache first
    if (FEATURE_FLAGS.enableCaching) {
      const cached = await cacheManager.get<PrayerTimesData>('prayer', cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const endpoint = `timingsByCity/${dateStr}?city=${encodeURIComponent(city)}${country ? `&country=${encodeURIComponent(country)}` : ''}&method=${this.defaultMethod}&school=${this.defaultSchool}`;
      
      const response = await this.get<PrayerApiResponse<PrayerTimesData>>(`times/${endpoint}`);
      
      // Transform the response to match our interface
      const prayerData = this.transformPrayerResponse(response.data);

      // Cache the result
      if (FEATURE_FLAGS.enableCaching) {
        await cacheManager.set('prayer', cacheKey, prayerData);
      }

      return prayerData;
    } catch (error) {
      if (FEATURE_FLAGS.enableBackupAPIs && error instanceof APIError) {
        const location = await LocationService.getLocationByCity(city, country);
        return this.getPrayerTimesFromBackup(location, targetDate);
      }
      throw error;
    }
  }

  /**
   * Get prayer times for multiple days
   */
  async getPrayerTimesRange(
    startDate: Date, 
    endDate: Date, 
    location?: LocationData
  ): Promise<PrayerTimesData[]> {
    const targetLocation = location || await LocationService.getCurrentLocation() || OFFLINE_CONFIG.defaultLocation;
    const results: PrayerTimesData[] = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      try {
        const prayerTimes = await this.getPrayerTimes(targetLocation, new Date(currentDate));
        results.push(prayerTimes);
      } catch (error) {
        console.warn(`Failed to get prayer times for ${currentDate.toDateString()}:`, error);
        // Continue with next date instead of failing completely
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * Get next prayer time from current prayer times
   */
  getNextPrayer(prayerTimes: PrayerTimesData): { name: string; time: string; timeToNext: string } | null {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.timings.fajr },
      { name: 'Dhuhr', time: prayerTimes.timings.dhuhr },
      { name: 'Asr', time: prayerTimes.timings.asr },
      { name: 'Maghrib', time: prayerTimes.timings.maghrib },
      { name: 'Isha', time: prayerTimes.timings.isha },
    ];

    for (const prayer of prayers) {
      const prayerTime = this.parseTime(prayer.time);
      if (prayerTime > currentTime) {
        const timeToNext = this.calculateTimeToNext(currentTime, prayerTime);
        return {
          name: prayer.name,
          time: prayer.time,
          timeToNext,
        };
      }
    }

    // If no prayer left today, next is Fajr tomorrow
    const fajrTime = this.parseTime(prayers[0].time);
    const timeToNext = this.calculateTimeToNext(currentTime, fajrTime + 24 * 60); // Add 24 hours
    
    return {
      name: 'Fajr',
      time: prayers[0].time,
      timeToNext,
    };
  }

  /**
   * Convert API prayer times to app format (for existing components)
   */
  convertToAppFormat(prayerTimes: PrayerTimesData): PrayerTime[] {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', arabicName: 'الفجر', time: prayerTimes.timings.fajr },
      { name: 'Dhuhr', arabicName: 'الظهر', time: prayerTimes.timings.dhuhr },
      { name: 'Asr', arabicName: 'العصر', time: prayerTimes.timings.asr },
      { name: 'Maghrib', arabicName: 'المغرب', time: prayerTimes.timings.maghrib },
      { name: 'Isha', arabicName: 'العشاء', time: prayerTimes.timings.isha },
    ];

    let nextPrayerFound = false;

    return prayers.map(prayer => {
      const prayerTime = this.parseTime(prayer.time);
      const isPassed = prayerTime < currentTime;
      const isNext = !isPassed && !nextPrayerFound;
      
      if (isNext) {
        nextPrayerFound = true;
      }

      return {
        name: prayer.name,
        arabicName: prayer.arabicName,
        time: prayer.time,
        isPassed,
        isNext,
        isCurrent: false, // Would need more logic to determine current prayer
      };
    });
  }

  /**
   * Preload prayer times for offline use
   */
  async preloadPrayerTimes(location?: LocationData, days: number = 7): Promise<void> {
    if (!OFFLINE_CONFIG.preload.enabled) {
      return;
    }

    const targetLocation = location || await LocationService.getCurrentLocation() || OFFLINE_CONFIG.defaultLocation;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    try {
      await this.getPrayerTimesRange(startDate, endDate, targetLocation);
      console.log(`Preloaded prayer times for ${days} days`);
    } catch (error) {
      console.warn('Failed to preload prayer times:', error);
    }
  }

  // Helper methods
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateTimeToNext(currentTime: number, nextTime: number): string {
    const diff = nextTime - currentTime;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  private transformPrayerResponse(data: any, location?: LocationData): PrayerTimesData {
    // Transform the API response to match our interface
    // Note: The actual structure may vary depending on the API response
    return data as PrayerTimesData;
  }

  // Backup/offline methods
  private async getPrayerTimesFromBackup(
    location: LocationData | null, 
    date: Date
  ): Promise<PrayerTimesData> {
    // Fallback to calculated prayer times or cached data
    const defaultLocation = location || OFFLINE_CONFIG.defaultLocation;
    
    // Return sample prayer times as fallback
    return {
      timings: {
        fajr: '05:30',
        sunrise: '06:45',
        dhuhr: '12:25',
        asr: '15:45',
        sunset: '18:20',
        maghrib: '18:20',
        isha: '19:45',
        imsak: '05:20',
        midnight: '00:15',
      },
      date: {
        readable: date.toLocaleDateString(),
        timestamp: date.toISOString(),
        hijri: {
          date: '01-01-1446',
          format: 'DD-MM-YYYY',
          day: '01',
          weekday: { en: 'Monday', ar: 'الإثنين' },
          month: { number: 1, en: 'Muharram', ar: 'مُحَرَّم' },
          year: '1446',
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
          holidays: [],
        },
        gregorian: {
          date: date.toLocaleDateString(),
          format: 'DD-MM-YYYY',
          day: date.getDate().toString().padStart(2, '0'),
          weekday: { en: date.toLocaleDateString('en', { weekday: 'long' }) },
          month: { 
            number: date.getMonth() + 1, 
            en: date.toLocaleDateString('en', { month: 'long' }) 
          },
          year: date.getFullYear().toString(),
          designation: { abbreviated: 'AD', expanded: 'Anno Domini' },
        },
      },
      meta: {
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        timezone: defaultLocation.timezone || 'UTC',
        method: {
          id: this.defaultMethod,
          name: 'ISNA',
          params: { Fajr: 15, Isha: 15 },
        },
        latitudeAdjustmentMethod: 'MIDDLE_OF_THE_NIGHT',
        midnightMode: 'STANDARD',
        school: 'STANDARD',
        offset: {},
      },
    };
  }
}

// Singleton instance
export const prayerClient = new PrayerTimesAPIClient();