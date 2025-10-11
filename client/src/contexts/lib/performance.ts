
/**
 * Performance Monitoring Utilities
 */

// Web Vitals tracking
export function trackWebVitals() {
  if ('web-vitals' in window) {
    return;
  }

  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      // LCP tracked: lastEntry.startTime
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming;
        if (fidEntry.processingStart) {
          // FID tracked: fidEntry.processingStart - fidEntry.startTime
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      // CLS tracked: clsValue
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  }
}

// Component render tracking
export function useRenderTracking(componentName: string) {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    // Render count tracked for component: componentName
  });
}

// Bundle size analysis helper
export function reportBundleSize() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const scripts = resources.filter(r => r.name.includes('.js'));
    const totalSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    // Bundle metrics tracked: totalSize and scripts.length
  }
}

import React from 'react';
