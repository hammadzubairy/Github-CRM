export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when a real Supabase project is wired up. Otherwise the app runs on seeded demo data. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const DEMO_COOKIE = "fd_demo";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://saas.ahmadkhajeh.com";
}
