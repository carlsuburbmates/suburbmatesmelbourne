import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * PostHog analytics utilities for tracking user behavior
 */

/**
 * Hook to automatically track page views in PostHog
 */
export const usePostHogPageView = (pageName: string) => {
  useEffect(() => {
    if (typeof window !== "undefined" && posthog.__loaded) {
      posthog.capture("$pageview", {
        page: pageName,
      });
    }
  }, [pageName]);
};

/**
 * Track custom events with optional properties
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
};
