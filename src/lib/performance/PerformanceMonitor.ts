/**
 * Performance Monitoring System for Quran App
 * Tracks rendering performance, memory usage, and app metrics
 */

import React from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  listScrollFPS: number;
  apiResponseTime: number;
  cacheHitRate: number;
  timestamp: number;
}

interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryImpact: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private renderStartTimes: Map<string, number> = new Map();
  private memoryBaseline = 0;
  private frameDropCount = 0;
  private lastFrameTime = 0;

  private constructor() {
    this.initializeMemoryBaseline();
    this.startFPSMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track component render start
   */
  markRenderStart(componentName: string): void {
    this.renderStartTimes.set(componentName, performance.now());
  }

  /**
   * Track component render end and calculate metrics
   */
  markRenderEnd(componentName: string): void {
    const startTime = this.renderStartTimes.get(componentName);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    const currentMetrics = this.componentMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryImpact: 0,
    };

    // Update metrics
    currentMetrics.renderCount++;
    currentMetrics.lastRenderTime = renderTime;
    currentMetrics.averageRenderTime = 
      (currentMetrics.averageRenderTime * (currentMetrics.renderCount - 1) + renderTime) / 
      currentMetrics.renderCount;

    this.componentMetrics.set(componentName, currentMetrics);
    this.renderStartTimes.delete(componentName);

    // Log slow renders
    if (renderTime > 16) { // >16ms = dropping below 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track API response time
   */
  trackAPICall(endpoint: string, responseTime: number, cached: boolean = false): void {
    const metrics: Partial<PerformanceMetrics> = {
      apiResponseTime: responseTime,
      timestamp: Date.now(),
    };

    if (cached) {
      // Update cache hit rate
      const recentMetrics = this.getRecentMetrics(60000); // Last minute
      const totalCalls = recentMetrics.length + 1;
      const cachedCalls = recentMetrics.filter(m => m.cacheHitRate > 0).length + 1;
      metrics.cacheHitRate = (cachedCalls / totalCalls) * 100;
    }

    this.addMetrics(metrics);

    // Log slow API calls
    if (responseTime > 2000) { // >2s
      console.warn(`Slow API call: ${endpoint} took ${responseTime}ms`);
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): number {
    if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
      return 0;
    }

    const memory = window.performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    
    // Check for memory leaks
    if (usedMB > this.memoryBaseline + 50) { // >50MB increase
      console.warn(`Potential memory leak detected. Current usage: ${usedMB}MB, Baseline: ${this.memoryBaseline}MB`);
    }

    this.addMetrics({ memoryUsage: usedMB, timestamp: Date.now() });
    return usedMB;
  }

  /**
   * Track FlatList scroll performance
   */
  trackScrollPerformance(listName: string, scrollEvent: any): void {
    const currentTime = performance.now();
    const timeDiff = currentTime - this.lastFrameTime;
    
    if (timeDiff > 16.67) { // >16.67ms = below 60fps
      this.frameDropCount++;
    }

    const fps = Math.min(60, 1000 / timeDiff);
    
    this.addMetrics({
      listScrollFPS: fps,
      timestamp: Date.now(),
    });

    this.lastFrameTime = currentTime;

    // Log performance issues
    if (fps < 50) {
      console.warn(`Low scroll FPS detected: ${fps.toFixed(1)} fps in ${listName}`);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageRenderTime: number;
    memoryUsage: number;
    scrollFPS: number;
    apiResponseTime: number;
    cacheHitRate: number;
    frameDrops: number;
    criticalIssues: string[];
  } {
    const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes
    
    const avgRenderTime = Array.from(this.componentMetrics.values())
      .reduce((sum, metric) => sum + metric.averageRenderTime, 0) / 
      Math.max(this.componentMetrics.size, 1);

    const avgMemory = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / recentMetrics.length
      : 0;

    const avgScrollFPS = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.listScrollFPS || 60), 0) / recentMetrics.length
      : 60;

    const avgAPITime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.apiResponseTime || 0), 0) / recentMetrics.length
      : 0;

    const avgCacheHit = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / recentMetrics.length
      : 0;

    // Identify critical issues
    const criticalIssues: string[] = [];
    if (avgRenderTime > 16) criticalIssues.push('Slow rendering detected');
    if (avgMemory > 150) criticalIssues.push('High memory usage');
    if (avgScrollFPS < 50) criticalIssues.push('Poor scroll performance');
    if (avgAPITime > 2000) criticalIssues.push('Slow API responses');
    if (avgCacheHit < 70) criticalIssues.push('Low cache efficiency');

    return {
      averageRenderTime: avgRenderTime,
      memoryUsage: avgMemory,
      scrollFPS: avgScrollFPS,
      apiResponseTime: avgAPITime,
      cacheHitRate: avgCacheHit,
      frameDrops: this.frameDropCount,
      criticalIssues,
    };
  }

  /**
   * Get component-specific performance metrics
   */
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): {
    summary: ReturnType<typeof this.getPerformanceSummary>;
    components: ComponentMetrics[];
    rawMetrics: PerformanceMetrics[];
  } {
    return {
      summary: this.getPerformanceSummary(),
      components: this.getComponentMetrics(),
      rawMetrics: this.getRecentMetrics(3600000), // Last hour
    };
  }

  /**
   * Reset metrics (for testing or periodic cleanup)
   */
  resetMetrics(): void {
    this.metrics = [];
    this.componentMetrics.clear();
    this.renderStartTimes.clear();
    this.frameDropCount = 0;
    this.initializeMemoryBaseline();
  }

  /**
   * Check if app performance meets target benchmarks
   */
  meetsBenchmarks(): {
    overall: boolean;
    details: {
      renderTime: boolean; // <16ms for 60fps
      memoryUsage: boolean; // <150MB
      scrollFPS: boolean; // >55fps
      apiResponse: boolean; // <2s
      cacheHit: boolean; // >70%
    };
  } {
    const summary = this.getPerformanceSummary();
    
    const details = {
      renderTime: summary.averageRenderTime < 16,
      memoryUsage: summary.memoryUsage < 150,
      scrollFPS: summary.scrollFPS > 55,
      apiResponse: summary.apiResponseTime < 2000,
      cacheHit: summary.cacheHitRate > 70,
    };

    const overall = Object.values(details).every(meets => meets);

    return { overall, details };
  }

  // Private helper methods
  private initializeMemoryBaseline(): void {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      this.memoryBaseline = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
    }
  }

  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    const monitor = () => {
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta > 16.67) { // Frame drop detected
        this.frameDropCount++;
      }
      
      lastTime = now;
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  private addMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.metrics.push({
      renderTime: 0,
      memoryUsage: 0,
      listScrollFPS: 60,
      apiResponseTime: 0,
      cacheHitRate: 0,
      timestamp: Date.now(),
      ...metrics,
    });

    // Keep only recent metrics to prevent memory buildup
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = React.useRef(performanceMonitor);
  
  React.useEffect(() => {
    monitor.current.markRenderStart(componentName);
    return () => {
      monitor.current.markRenderEnd(componentName);
    };
  });

  return {
    trackScrollPerformance: (scrollEvent: any) => 
      monitor.current.trackScrollPerformance(componentName, scrollEvent),
    trackMemoryUsage: () => monitor.current.trackMemoryUsage(),
    getMetrics: () => monitor.current.getPerformanceSummary(),
  };
}

// Performance HOC for component monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const monitor = performanceMonitor;
    
    React.useEffect(() => {
      monitor.markRenderStart(componentName);
      return () => {
        monitor.markRenderEnd(componentName);
      };
    });

    return <WrappedComponent ref={ref} {...props} />;
  });
}