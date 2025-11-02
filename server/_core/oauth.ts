import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { supabaseAuth } from "./supabase";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Supabase OAuth callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // Exchange code for session with Supabase
      const { session, user } = await supabaseAuth.exchangeCodeForSession(code);

      if (!session?.access_token || !user?.id) {
        res.status(400).json({ error: "Failed to create session" });
        return;
      }

      // Sync user with local database
      await db.upsertUser({
        openId: user.id,
        name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        email: user.email || null,
        loginMethod: user.app_metadata?.provider || "email",
        lastSignedIn: new Date(),
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, session.access_token, cookieOptions);

      // Redirect to dashboard or original destination
      const redirectUrl = state ? decodeURIComponent(state) : "/dashboard";
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback error:", error);
      res.status(500).json({
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Sign out endpoint
  app.post("/api/oauth/logout", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie;
      if (cookies) {
        const cookieMap = new Map<string, string>();
        cookies.split(";").forEach(cookie => {
          const [name, ...rest] = cookie.trim().split("=");
          if (name && rest.length > 0) {
            cookieMap.set(name, rest.join("="));
          }
        });

        const token = cookieMap.get(COOKIE_NAME);
        if (token) {
          await supabaseAuth.signOut(token);
        }
      }

      // Clear session cookie
      res.clearCookie(COOKIE_NAME);
      res.json({ success: true });
    } catch (error) {
      console.error("[OAuth] Logout error:", error);
      res.status(500).json({
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
