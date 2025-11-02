import { createClient } from "@supabase/supabase-js";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Initialize Supabase client - gracefully handle missing credentials for development
const supabaseUrl =
  ENV.supabaseUrl ||
  process.env.SUPABASE_URL ||
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  ENV.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseAuthService {
  private supabase = supabase;
  private isConfigured =
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key";

  /**
   * Exchange authorization code for session
   */
  async exchangeCodeForSession(code: string) {
    if (!this.isConfigured) {
      throw new Error(
        "Supabase not configured - please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables"
      );
    }
    const { data, error } =
      await this.supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error(`Failed to exchange code: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user from session token
   */
  async getUserFromToken(accessToken: string) {
    if (!this.isConfigured) {
      throw new Error(
        "Supabase not configured - please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables"
      );
    }

    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(accessToken);

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return user;
  }

  /**
   * Sign out user session
   */
  async signOut(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      return null;
    }

    return data.user;
  }

  /**
   * Authenticate request using cookie or Authorization header
   */
  async authenticateRequest(req: Request): Promise<User> {
    let token: string | undefined;

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token) {
      const cookies = this.parseCookies(req.headers.cookie);
      token = cookies.get(COOKIE_NAME);
    }

    if (!token) {
      throw new Error("No authentication token found");
    }

    const supabaseUser = await this.verifyToken(token);
    if (!supabaseUser) {
      throw new Error("Invalid authentication token");
    }

    // Sync user with local database
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(supabaseUser.id);

    if (!user) {
      await db.upsertUser({
        openId: supabaseUser.id,
        name:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.email?.split("@")[0] ||
          null,
        email: supabaseUser.email || null,
        loginMethod: this.deriveLoginMethod(
          supabaseUser.app_metadata?.provider
        ),
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(supabaseUser.id);
    } else {
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
      });
    }

    if (!user) {
      throw new Error("User not found after sync");
    }

    return user;
  }

  private parseCookies(cookieHeader: string | undefined): Map<string, string> {
    const cookies = new Map<string, string>();
    if (!cookieHeader) return cookies;

    cookieHeader.split(";").forEach(cookie => {
      const [name, ...rest] = cookie.trim().split("=");
      if (name && rest.length > 0) {
        cookies.set(name, rest.join("="));
      }
    });

    return cookies;
  }

  private deriveLoginMethod(provider?: string): string | null {
    if (!provider) return "email";

    const providerMap: Record<string, string> = {
      google: "google",
      github: "github",
      apple: "apple",
      microsoft: "microsoft",
      azure: "microsoft",
    };

    return providerMap[provider.toLowerCase()] || provider.toLowerCase();
  }
}

export const supabaseAuth = new SupabaseAuthService();
