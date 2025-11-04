export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

export const NOTIFICATION_TYPES = [
  "order_placed",
  "order_received",
  "order_completed",
  "refund_initiated",
  "refund_completed",
  "dispute_filed",
  "dispute_resolved",
  "inventory_low",
  "inventory_out_of_stock",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
