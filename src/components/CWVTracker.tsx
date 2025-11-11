"use client";

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

// Extend Window interface for gtag and dataLayer
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Core Web Vitals (CWV) Tracker
 * Tracks LCP, CLS, and INP and sends to GA4/GTM
 * 
 * SLOs (Service Level Objectives):
 * - LCP (Largest Contentful Paint): < 2.5s p75
 * - CLS (Cumulative Layout Shift): < 0.1
 * - INP (Interaction to Next Paint): < 200ms
 * 
 * GA4 Event Format:
 * - Event Name: 'web_vitals'
 * - Parameters: metric_name, value, rating, delta, id, page_location
 */
export default function CWVTracker() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Initialize dataLayer if it doesn't exist
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    /**
     * Send Web Vitals metric to GA4/GTM
     */
    const sendToGA4 = (metric: Metric) => {
      const { name, value, rating, delta, id } = metric;
      
      // Determine rating label
      const ratingLabel = rating === 'good' ? 'good' : rating === 'needs-improvement' ? 'needs-improvement' : 'poor';
      
      // Prepare event data for dataLayer (GTM)
      const eventData = {
        event: 'web_vitals',
        metric_name: name, // 'LCP', 'CLS', 'INP'
        value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS in thousandths, others in milliseconds
        rating: ratingLabel, // 'good', 'needs-improvement', 'poor'
        delta: Math.round(delta), // The delta value
        metric_id: id, // Unique ID for deduplication
        page_location: window.location.href,
        page_path: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      // Push to dataLayer (GTM)
      if (window.dataLayer) {
        window.dataLayer.push(eventData);
      }

      // Send to GA4 via gtag (if available)
      if (window.gtag) {
        window.gtag('event', name, {
          event_category: 'Web Vitals',
          event_label: ratingLabel,
          value: Math.round(name === 'CLS' ? value * 1000 : value),
          metric_rating: ratingLabel,
          metric_delta: Math.round(delta),
          metric_id: id,
          non_interaction: true,
        });
      }

      // Log for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CWV] ${name}:`, {
          value: name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`,
          rating: ratingLabel,
          delta: `${Math.round(delta)}ms`,
        });
      }
    };

    // Track Largest Contentful Paint (LCP)
    // Measures loading performance - should be < 2.5s
    onLCP(sendToGA4);

    // Track Cumulative Layout Shift (CLS)
    // Measures visual stability - should be < 0.1
    onCLS(sendToGA4);

    // Track Interaction to Next Paint (INP)
    // Measures interactivity - should be < 200ms
    onINP(sendToGA4);
  }, []);

  return null; // This component doesn't render anything
}

