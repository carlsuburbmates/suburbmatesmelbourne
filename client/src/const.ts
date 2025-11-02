export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate Supabase OAuth login URL
export const getLoginUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = encodeURIComponent(window.location.pathname);

  // Default to Google OAuth, but this can be made configurable
  const provider = "google";

  const url = new URL(`${supabaseUrl}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
};

// Alternative: Email-based passwordless login
export const getEmailLoginUrl = (email: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const url = new URL(`${supabaseUrl}/auth/v1/magiclink`);
  url.searchParams.set("email", email);
  url.searchParams.set("redirect_to", redirectUri);

  return url.toString();
};
