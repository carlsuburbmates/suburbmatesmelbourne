/**
 * Quick example (matches curl usage):
 *   await callDataApi("Youtube/search", {
 *     query: { gl: "US", hl: "en", q: "manus" },
 *   })
 */
import { ENV } from "./env";
import { createHash } from "crypto";
import { getDb } from "../db";
import { consents } from "../../drizzle/schema";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "webdevtoken.v1.WebDevService/CallApi",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      apiId,
      query: options.query,
      body: options.body,
      path_params: options.pathParams,
      multipart_form_data: options.formData,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload === "object" && "jsonData" in payload) {
    try {
      return JSON.parse((payload as Record<string, string>).jsonData ?? "{}");
    } catch {
      return (payload as Record<string, unknown>).jsonData;
    }
  }
  return payload;
}

/**
 * Logs user consent actions with cryptographic integrity
 * Creates an immutable hash of the consent data for audit trails
 *
 * @param userId - User ID from authenticated context (numeric ID from database)
 * @param action - Consent action (e.g., 'privacy_accepted', 'marketing_opted_in')
 * @returns Promise resolving to the inserted consent record
 */
export async function logConsent(userId: number, action: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const timestamp = new Date();

  // Create immutable hash of consent data for audit integrity
  const dataToHash = JSON.stringify({
    userId,
    action,
    timestamp: timestamp.toISOString(),
  });

  const immutableHash = createHash("sha256").update(dataToHash).digest("hex");

  // Insert consent record and get the insertId
  const result = await db.insert(consents).values({
    userId,
    action,
    timestamp,
    immutableHash,
  });

  // Return the inserted record ID
  return {
    id: result.insertId,
    userId,
    action,
    timestamp,
    immutableHash,
  };
}
