"use client";

import { useEffect } from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Core Web Vitals (CWV) Tracker
 * Tracks LCP, CLS, and INP and sends to analytics
 * SLOs: LCP < 2.5s p75, CLS < 0.1, INP < 200ms
 * 
 * Note: web-vitals package is optional. Install with: npm install web-vitals
 * This component will gracefully skip tracking if web-vitals is not installed.
 */
export default function CWVTracker() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check if web-vitals is available (optional dependency)
    const trackCWV = async () => {
      // Only run in browser (client-side)
      if (typeof window === 'undefined') return;

      try {
        // Use completely dynamic string import to avoid Turbopack static analysis
        // Construct the module name dynamically so Turbopack can't resolve it statically
        const moduleName = 'web' + '-' + 'vitals';
        const webVitalsModule = await import(/* @vite-ignore */ moduleName).catch(() => null);
        
        if (!webVitalsModule) {
          // web-vitals not installed - that's okay, just skip tracking
          return;
        }

        const { onCLS, onINP, onLCP } = webVitalsModule;
        
        // Track Largest Contentful Paint (LCP)
        onLCP((metric) => {
          console.log('LCP:', metric);
          // Send to analytics (replace with your analytics service)
          if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }
        });

        // Track Cumulative Layout Shift (CLS)
        onCLS((metric) => {
          console.log('CLS:', metric);
          if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(metric.value * 1000) / 1000, // Keep 3 decimal places
              non_interaction: true,
            });
          }
        });

        // Track Interaction to Next Paint (INP)
        onINP((metric) => {
          console.log('INP:', metric);
          if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'INP',
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }
        });
      } catch (error) {
        // web-vitals not installed or failed to load - that's okay
        console.debug('web-vitals not available. Install with: npm install web-vitals');
      }
    };

    trackCWV();
  }, []);

  return null; // This component doesn't render anything
}

