import posthog from 'posthog-js';
import { useEffect } from 'react';

/**
 * PostHog analytics utilities for tracking user behavior
 */

/**
 * Hook to track page views automatically
 */
export const usePostHogPageView = (pageName: string) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_name: pageName,
        $referrer: document.referrer,
      });
    }
  }, [pageName]);
};

/**
 * Track button clicks and user interactions
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
    });
  }
};

/**
 * Track business-related actions
 */
export const trackBusinessAction = (action: string, businessData?: {
  businessId?: number;
  businessName?: string;
  suburb?: string;
}) => {
  trackEvent(`business_${action}`, {
    business_id: businessData?.businessId,
    business_name: businessData?.businessName,
    suburb: businessData?.suburb,
    source: 'web_app',
  });
};

/**
 * Track user authentication events
 */
export const trackAuthEvent = (event: 'login' | 'logout' | 'signup') => {
  trackEvent(`user_${event}`, {
    auth_provider: 'supabase',
    source: 'web_app',
  });
};

/**
 * Track search and discovery actions
 */
export const trackSearchEvent = (query?: string, filters?: Record<string, any>) => {
  trackEvent('search_performed', {
    search_query: query,
    filters: filters,
    source: 'directory_page',
  });
};

/**
 * Track AI feature usage
 */
export const trackAIEvent = (feature: string, data?: Record<string, any>) => {
  trackEvent(`ai_${feature}`, {
    ...data,
    ai_feature: feature,
    source: 'web_app',
  });
};

/**
 * Identify user for personalized analytics
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, properties);
  }
};

/**
 * Track errors and exceptions
 */
export const trackError = (error: Error, context?: Record<string, any>) => {
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    error_context: context,
    page_url: window.location.href,
  });
};