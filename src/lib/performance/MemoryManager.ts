/**
 * Memory Management for Quran App
 * Handles memory optimization and cleanup for large datasets
 */

interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  maxCacheSize: number; // MB
}

interface MemoryCleanupStrategy {
  clearUnusedVerses: () => Promise<void>;
  clearOldCacheEntries: () => Promise<void>;
  optimizeImageCache: () => Promise<void>;
  forceCacheEviction: () => Promise<void>;
}

class MemoryManager {
  private static instance: MemoryManager;
  private readonly thresholds: MemoryThresholds = {
    warning: 100,
    critical: 150,
    maxCacheSize: 50,
  };

  private cleanupInProgress = false;
  private lastCleanup = 0;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private verseDataCache = new Map<string, any>();
  private imageCache = new Map<string, any>();

  private constructor() {
    this.startMemoryMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const memory = window.performance.memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return { used, total, percentage };
  }

  /**
   * Check if memory cleanup is needed
   */
  needsCleanup(): boolean {
    const memory = this.getCurrentMemoryUsage();
    return memory.used > this.thresholds.warning;
  }

  /**
   * Perform intelligent memory cleanup
   */
  async performCleanup(aggressive: boolean = false): Promise<{
    beforeCleanup: number;
    afterCleanup: number;
    freed: number;
    strategies: string[];
  }> {
    if (this.cleanupInProgress) {
      return { beforeCleanup: 0, afterCleanup: 0, freed: 0, strategies: [] };
    }

    this.cleanupInProgress = true;
    const beforeCleanup = this.getCurrentMemoryUsage().used;
    const strategies: string[] = [];

    try {
      // Strategy 1: Clear unused verse data
      await this.clearUnusedVerseData();
      strategies.push('Cleared unused verses');

      // Strategy 2: Clean up old cache entries
      await this.clearOldCacheEntries();
      strategies.push('Cleared old cache entries');

      // Strategy 3: Optimize image cache
      await this.optimizeImageCache();
      strategies.push('Optimized image cache');

      // Strategy 4: Force garbage collection (if available)
      if (aggressive && typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
        strategies.push('Forced garbage collection');
      }

      // Strategy 5: Clear non-essential data if still critical
      const currentMemory = this.getCurrentMemoryUsage().used;
      if (aggressive || currentMemory > this.thresholds.critical) {
        await this.clearNonEssentialData();
        strategies.push('Cleared non-essential data');
      }

      const afterCleanup = this.getCurrentMemoryUsage().used;
      const freed = Math.max(0, beforeCleanup - afterCleanup);

      this.lastCleanup = Date.now();
      
      return {
        beforeCleanup,
        afterCleanup,
        freed,
        strategies,
      };
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Pre-emptive cleanup when loading large data sets
   */
  async prepareForLargeLoad(estimatedSize: number): Promise<void> {
    const memory = this.getCurrentMemoryUsage();
    const availableMemory = this.thresholds.warning - memory.used;

    if (estimatedSize > availableMemory) {
      console.log('Preparing memory for large data load...');
      await this.performCleanup(true);
    }
  }

  /**
   * Optimize memory for specific app scenarios
   */
  async optimizeForScenario(scenario: 'reading' | 'browsing' | 'search'): Promise<void> {
    switch (scenario) {
      case 'reading':
        // Keep current surah, clear other verse data
        await this.clearUnusedVerseData();
        await this.clearOldCacheEntries();
        break;
        
      case 'browsing':
        // Keep surah metadata, clear detailed verse data
        await this.clearDetailedVerseData();
        break;
        
      case 'search':
        // Prepare for search operations, clear large cached data
        await this.clearLargeCacheEntries();
        break;
    }
  }

  /**
   * Register data for managed cleanup
   */
  registerVerseData(surahNumber: number, verseData: any): void {
    const key = `surah_${surahNumber}`;
    this.verseDataCache.set(key, {
      data: verseData,
      lastAccessed: Date.now(),
      size: JSON.stringify(verseData).length,
    });

    // Limit cache size
    if (this.verseDataCache.size > 10) {
      this.evictOldestVerseData();
    }
  }

  /**
   * Register image for managed cleanup
   */
  registerImageData(imageKey: string, imageData: any): void {
    this.imageCache.set(imageKey, {
      data: imageData,
      lastAccessed: Date.now(),
      size: imageData.length || 1024, // Estimate
    });

    // Limit image cache
    if (this.imageCache.size > 20) {
      this.evictOldestImageData();
    }
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): {
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    actions: Array<{ action: string; benefit: string; }>;
  } {
    const memory = this.getCurrentMemoryUsage();
    const cacheSize = this.getCacheSize();

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const recommendations: string[] = [];
    const actions: Array<{ action: string; benefit: string; }> = [];

    if (memory.used > this.thresholds.critical) {
      severity = 'critical';
      recommendations.push('Memory usage is critically high');
      actions.push({
        action: 'Perform aggressive cleanup',
        benefit: 'Immediately free up memory',
      });
    } else if (memory.used > this.thresholds.warning) {
      severity = memory.used > 125 ? 'high' : 'medium';
      recommendations.push('Memory usage is above recommended levels');
      actions.push({
        action: 'Clear unused data',
        benefit: 'Reduce memory pressure',
      });
    }

    if (cacheSize > this.thresholds.maxCacheSize) {
      recommendations.push('Cache size is too large');
      actions.push({
        action: 'Optimize cache strategy',
        benefit: 'Reduce memory footprint',
      });
    }

    if (this.verseDataCache.size > 8) {
      recommendations.push('Too many verses cached');
      actions.push({
        action: 'Clear unused verse data',
        benefit: 'Free up verse cache memory',
      });
    }

    return { severity, recommendations, actions };
  }

  // Private methods for cleanup strategies
  private async clearUnusedVerseData(): Promise<void> {
    const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
    
    for (const [key, entry] of this.verseDataCache.entries()) {
      if (entry.lastAccessed < cutoffTime) {
        this.verseDataCache.delete(key);
      }
    }
  }

  private async clearDetailedVerseData(): Promise<void> {
    // Keep only metadata, clear full verse text
    for (const [key, entry] of this.verseDataCache.entries()) {
      if (entry.data && entry.data.ayahs) {
        entry.data = {
          ...entry.data,
          ayahs: entry.data.ayahs.map((ayah: any) => ({
            ayah: { numberInSurah: ayah.ayah.numberInSurah },
            translations: [], // Clear translations to save memory
          })),
        };
      }
    }
  }

  private async clearOldCacheEntries(): Promise<void> {
    // This would integrate with cacheManager
    console.log('Clearing old cache entries...');
  }

  private async clearLargeCacheEntries(): Promise<void> {
    const sizeThreshold = 50000; // 50KB
    
    for (const [key, entry] of this.verseDataCache.entries()) {
      if (entry.size > sizeThreshold) {
        this.verseDataCache.delete(key);
      }
    }
  }

  private async clearNonEssentialData(): Promise<void> {
    // Clear all but the most recently accessed data
    const entries = Array.from(this.verseDataCache.entries())
      .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
    
    // Keep only the 3 most recent
    const toKeep = entries.slice(0, 3);
    this.verseDataCache.clear();
    
    toKeep.forEach(([key, value]) => {
      this.verseDataCache.set(key, value);
    });
  }

  private async optimizeImageCache(): Promise<void> {
    // Clear least recently used images
    if (this.imageCache.size > 10) {
      const entries = Array.from(this.imageCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Remove oldest half
      const toRemove = entries.slice(0, Math.floor(entries.length / 2));
      toRemove.forEach(([key]) => {
        this.imageCache.delete(key);
      });
    }
  }

  private evictOldestVerseData(): void {
    let oldest = { key: '', time: Date.now() };
    
    for (const [key, entry] of this.verseDataCache.entries()) {
      if (entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }
    
    if (oldest.key) {
      this.verseDataCache.delete(oldest.key);
    }
  }

  private evictOldestImageData(): void {
    let oldest = { key: '', time: Date.now() };
    
    for (const [key, entry] of this.imageCache.entries()) {
      if (entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }
    
    if (oldest.key) {
      this.imageCache.delete(oldest.key);
    }
  }

  private getCacheSize(): number {
    let totalSize = 0;
    
    for (const entry of this.verseDataCache.values()) {
      totalSize += entry.size || 0;
    }
    
    for (const entry of this.imageCache.values()) {
      totalSize += entry.size || 0;
    }
    
    return Math.round(totalSize / 1024 / 1024); // MB
  }

  private startMemoryMonitoring(): void {
    // Check memory every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      const memory = this.getCurrentMemoryUsage();
      
      if (memory.used > this.thresholds.critical) {
        console.warn('Critical memory usage detected, performing cleanup...');
        this.performCleanup(true).catch(console.error);
      } else if (memory.used > this.thresholds.warning) {
        // Only cleanup if it's been 5 minutes since last cleanup
        if (Date.now() - this.lastCleanup > 300000) {
          this.performCleanup(false).catch(console.error);
        }
      }
    }, 30000);
  }

  /**
   * Clean up monitoring when app closes
   */
  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    this.verseDataCache.clear();
    this.imageCache.clear();
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// React hook for memory management
export function useMemoryManager() {
  const manager = React.useRef(memoryManager);
  
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount is handled by the singleton
    };
  }, []);

  return {
    getCurrentMemoryUsage: () => manager.current.getCurrentMemoryUsage(),
    performCleanup: () => manager.current.performCleanup(),
    optimizeForScenario: (scenario: 'reading' | 'browsing' | 'search') => 
      manager.current.optimizeForScenario(scenario),
    getRecommendations: () => manager.current.getOptimizationRecommendations(),
  };
}

import React from 'react';