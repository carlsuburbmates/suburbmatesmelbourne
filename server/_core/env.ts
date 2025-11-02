export const ENV = {
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Supabase Auth (replacing Manus OAuth)
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // OpenAI API
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  // PostHog Analytics
  posthogProjectApiKey: process.env.POSTHOG_PROJECT_API_KEY ?? "",
  posthogHost: process.env.POSTHOG_HOST ?? "https://app.posthog.com",

  // Application Settings
  cookieSecret: process.env.JWT_SECRET ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
