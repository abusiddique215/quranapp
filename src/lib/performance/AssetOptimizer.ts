/**
 * Asset Optimizer for Quran App
 * Handles lazy loading, image optimization, and bundle splitting
 */

import React from 'react';

interface AssetMetrics {
  totalSize: number;
  loadTime: number;
  cacheHitRate: number;
  failedLoads: number;
}

interface OptimizedImageProps {
  uri: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: string;
}

class AssetOptimizer {
  private static instance: AssetOptimizer;
  private imageCache = new Map<string, string>();
  private loadingImages = new Set<string>();
  private metrics: AssetMetrics = {
    totalSize: 0,
    loadTime: 0,
    cacheHitRate: 0,
    failedLoads: 0,
  };

  private constructor() {
    this.initializeOptimizations();
  }

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  /**
   * Optimized image loading with caching
   */
  async loadOptimizedImage(props: OptimizedImageProps): Promise<string> {
    const { uri, width, height, quality = 80, priority = false } = props;
    
    // Create optimized cache key
    const cacheKey = `${uri}_${width}_${height}_${quality}`;
    
    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      this.metrics.cacheHitRate++;
      return this.imageCache.get(cacheKey)!;
    }

    // Prevent duplicate loading
    if (this.loadingImages.has(cacheKey)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (this.imageCache.has(cacheKey)) {
            resolve(this.imageCache.get(cacheKey)!);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    this.loadingImages.add(cacheKey);

    try {
      const startTime = Date.now();
      
      // Load and optimize image
      const optimizedUri = await this.processImage(uri, width, height, quality);
      
      const loadTime = Date.now() - startTime;
      this.metrics.loadTime += loadTime;
      
      // Cache the result
      this.imageCache.set(cacheKey, optimizedUri);
      this.loadingImages.delete(cacheKey);
      
      return optimizedUri;
    } catch (error) {
      this.metrics.failedLoads++;
      this.loadingImages.delete(cacheKey);
      console.warn('Failed to load optimized image:', error);
      return uri; // Fallback to original
    }
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages(imageUris: string[]): Promise<void> {
    const preloadPromises = imageUris.map(uri => 
      this.loadOptimizedImage({ uri, priority: true })
    );
    
    try {
      await Promise.allSettled(preloadPromises);
      console.log(`Preloaded ${imageUris.length} critical images`);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  /**
   * Lazy load images with intersection observer
   */
  createLazyImageLoader(): {
    loadImage: (element: HTMLImageElement, uri: string) => void;
    observer: IntersectionObserver | null;
  } {
    if (typeof window === 'undefined') {
      return { loadImage: () => {}, observer: null };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const uri = img.dataset.src;
            
            if (uri) {
              this.loadOptimizedImage({ uri })
                .then((optimizedUri) => {
                  img.src = optimizedUri;
                  img.classList.remove('lazy-loading');
                  img.classList.add('lazy-loaded');
                })
                .catch(() => {
                  img.src = uri; // Fallback
                });
            }
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    const loadImage = (element: HTMLImageElement, uri: string) => {
      element.dataset.src = uri;
      element.classList.add('lazy-loading');
      observer.observe(element);
    };

    return { loadImage, observer };
  }

  /**
   * Optimize bundle with code splitting
   */
  createDynamicImport<T>(
    importFunction: () => Promise<{ default: T }>,
    fallback?: T
  ): {
    Component: T | null;
    loading: boolean;
    error: Error | null;
    loadComponent: () => Promise<void>;
  } {
    const [Component, setComponent] = React.useState<T | null>(fallback || null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const loadComponent = React.useCallback(async () => {
      if (Component && !fallback) return; // Already loaded
      
      setLoading(true);
      setError(null);

      try {
        const module = await importFunction();
        setComponent(module.default);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load component'));
        console.error('Dynamic import failed:', err);
      } finally {
        setLoading(false);
      }
    }, [Component, fallback]);

    return { Component, loading, error, loadComponent };
  }

  /**
   * Optimize fonts and text rendering
   */
  optimizeFontLoading(): {
    loadCriticalFonts: () => void;
    loadArabicFonts: () => Promise<void>;
    preloadFontVariants: (variants: string[]) => Promise<void>;
  } {
    const loadCriticalFonts = () => {
      // Preload critical system fonts
      if (typeof document !== 'undefined') {
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = '/fonts/GeistVF.woff'; // Critical font
        fontLink.as = 'font';
        fontLink.type = 'font/woff';
        fontLink.crossOrigin = 'anonymous';
        document.head.appendChild(fontLink);
      }
    };

    const loadArabicFonts = async () => {
      if (typeof document !== 'undefined') {
        const arabicFont = new FontFace(
          'Amiri',
          'url(/fonts/Amiri-Regular.woff2) format("woff2")',
          {
            display: 'swap',
            unicodeRange: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF',
          }
        );

        try {
          await arabicFont.load();
          document.fonts.add(arabicFont);
          console.log('Arabic font loaded successfully');
        } catch (error) {
          console.warn('Failed to load Arabic font:', error);
        }
      }
    };

    const preloadFontVariants = async (variants: string[]) => {
      const loadPromises = variants.map(variant => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = variant;
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          link.onload = resolve;
          link.onerror = reject;
          document.head.appendChild(link);
        });
      });

      try {
        await Promise.allSettled(loadPromises);
      } catch (error) {
        console.warn('Some font variants failed to preload:', error);
      }
    };

    return { loadCriticalFonts, loadArabicFonts, preloadFontVariants };
  }

  /**
   * Implement progressive loading for large data sets
   */
  createProgressiveLoader<T>(
    data: T[],
    batchSize: number = 20,
    delay: number = 100
  ): {
    visibleData: T[];
    loadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
  } {
    const [visibleData, setVisibleData] = React.useState<T[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const loadMore = React.useCallback(async () => {
      if (isLoading || currentIndex >= data.length) return;

      setIsLoading(true);

      // Simulate async loading with delay for better UX
      await new Promise(resolve => setTimeout(resolve, delay));

      const nextBatch = data.slice(currentIndex, currentIndex + batchSize);
      setVisibleData(prev => [...prev, ...nextBatch]);
      setCurrentIndex(prev => prev + batchSize);
      setIsLoading(false);
    }, [data, batchSize, delay, currentIndex, isLoading]);

    // Load initial batch
    React.useEffect(() => {
      if (visibleData.length === 0 && data.length > 0) {
        loadMore();
      }
    }, [data, loadMore, visibleData.length]);

    const hasMore = currentIndex < data.length;

    return { visibleData, loadMore, hasMore, isLoading };
  }

  /**
   * Optimize network requests with batching and compression
   */
  createRequestOptimizer(): {
    batchRequests: <T>(requests: Array<() => Promise<T>>, batchSize?: number) => Promise<T[]>;
    compressPayload: (data: any) => Promise<string>;
    decompressPayload: (compressedData: string) => Promise<any>;
  } {
    const batchRequests = async <T>(
      requests: Array<() => Promise<T>>,
      batchSize: number = 3
    ): Promise<T[]> => {
      const results: T[] = [];
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => request());
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          const successfulResults = batchResults
            .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
            .map(result => result.value);
          
          results.push(...successfulResults);
        } catch (error) {
          console.warn('Batch request failed:', error);
        }

        // Small delay between batches to prevent API overload
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    };

    const compressPayload = async (data: any): Promise<string> => {
      // Simple compression (in production, use a proper compression library)
      return btoa(JSON.stringify(data));
    };

    const decompressPayload = async (compressedData: string): Promise<any> => {
      try {
        return JSON.parse(atob(compressedData));
      } catch (error) {
        console.error('Failed to decompress payload:', error);
        return null;
      }
    };

    return { batchRequests, compressPayload, decompressPayload };
  }

  /**
   * Get asset optimization metrics
   */
  getOptimizationMetrics(): AssetMetrics & {
    cacheSize: number;
    cacheHitRatePercentage: number;
    averageLoadTime: number;
  } {
    const cacheSize = this.imageCache.size;
    const totalRequests = this.metrics.cacheHitRate + this.metrics.failedLoads + cacheSize;
    const cacheHitRatePercentage = totalRequests > 0 
      ? (this.metrics.cacheHitRate / totalRequests) * 100 
      : 0;
    const averageLoadTime = cacheSize > 0 ? this.metrics.loadTime / cacheSize : 0;

    return {
      ...this.metrics,
      cacheSize,
      cacheHitRatePercentage,
      averageLoadTime,
    };
  }

  /**
   * Clear asset caches to free memory
   */
  clearCaches(): void {
    this.imageCache.clear();
    this.loadingImages.clear();
    this.metrics = {
      totalSize: 0,
      loadTime: 0,
      cacheHitRate: 0,
      failedLoads: 0,
    };
  }

  // Private helper methods
  private async processImage(
    uri: string,
    width?: number,
    height?: number,
    quality?: number
  ): Promise<string> {
    // In a real implementation, this would:
    // 1. Resize images based on device pixel ratio
    // 2. Convert to optimal formats (WebP, AVIF)
    // 3. Apply compression
    // 4. Generate multiple sizes for responsive loading
    
    // For now, return the original URI
    // In production, integrate with image optimization service
    return uri;
  }

  private initializeOptimizations(): void {
    if (typeof window !== 'undefined') {
      // Enable font display: swap for better perceived performance
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Export singleton instance
export const assetOptimizer = AssetOptimizer.getInstance();

// React hooks for asset optimization
export function useOptimizedImage(props: OptimizedImageProps) {
  const [optimizedUri, setOptimizedUri] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    
    assetOptimizer.loadOptimizedImage(props)
      .then((uri) => {
        if (isMounted) {
          setOptimizedUri(uri);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [props.uri, props.width, props.height, props.quality]);

  return { optimizedUri, loading, error };
}

export function useAssetOptimization() {
  return {
    preloadImages: (uris: string[]) => assetOptimizer.preloadCriticalImages(uris),
    getMetrics: () => assetOptimizer.getOptimizationMetrics(),
    clearCaches: () => assetOptimizer.clearCaches(),
    createLazyLoader: () => assetOptimizer.createLazyImageLoader(),
    optimizeFonts: () => assetOptimizer.optimizeFontLoading(),
  };
}