import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

export type PostHogEvent = {
  event: string;
  distinctId: string;
  properties?: Record<string, any>;
};

/**
 * Send server-side events to PostHog for analytics tracking
 */
export async function trackEvent({
  event,
  distinctId,
  properties = {},
}: PostHogEvent): Promise<boolean> {
  if (!ENV.posthogProjectApiKey) {
    console.warn(
      "[Analytics] PostHog API key not configured, skipping event tracking"
    );
    return false;
  }

  const payload = {
    api_key: ENV.posthogProjectApiKey,
    event,
    distinct_id: distinctId,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      $lib: "suburbmates-server",
      $lib_version: "1.0.0",
    },
  };

  try {
    const response = await fetch("https://app.posthog.com/capture/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        `[Analytics] Failed to track event: ${response.status} ${response.statusText}`
      );
      return false;
    }

    console.log(`[Analytics] Event tracked: ${event} for user ${distinctId}`);
    return true;
  } catch (error) {
    console.warn("[Analytics] Error tracking event:", error);
    return false;
  }
}

/**
 * Track business creation events for analytics
 */
export async function trackBusinessCreated(
  userId: string,
  businessData: {
    businessName: string;
    suburb?: string;
    category?: string;
    hasABN?: boolean;
  }
): Promise<void> {
  await trackEvent({
    event: "business_created",
    distinctId: userId,
    properties: {
      business_name: businessData.businessName,
      suburb: businessData.suburb,
      category: businessData.category,
      has_abn: businessData.hasABN,
      source: "vendor_dashboard",
    },
  });
}

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Track owner notification events (replaces old Manus notification service)
 * Now tracks to PostHog analytics instead of sending notifications
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  // Track as analytics event instead of sending notification
  await trackEvent({
    event: "owner_notification",
    distinctId: ENV.ownerOpenId || "system",
    properties: {
      notification_title: title,
      notification_content: content,
      source: "system",
    },
  });

  console.log(`[Analytics] Owner notification tracked: ${title}`);
  return true;
}
