"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  type AuthActionResult,
  type ForgotPasswordValues,
  type LoginValues,
  type SignupValues,
} from "./schemas";

function safeNext(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/app";
  return next;
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : getSiteUrl();
}

async function setDemoCookie() {
  const store = await cookies();
  store.set(DEMO_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function startDemoSession(next?: string): Promise<never> {
  await setDemoCookie();
  redirect(safeNext(next));
}

export async function signInWithPassword(values: LoginValues, next?: string): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (!isSupabaseConfigured) {
    await setDemoCookie();
    redirect(safeNext(next));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  (await cookies()).delete(DEMO_COOKIE);
  redirect(safeNext(next));
}

export async function signUpWithPassword(values: SignupValues): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (!isSupabaseConfigured) {
    await setDemoCookie();
    redirect("/app?welcome=1");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase!.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
      data: { full_name: parsed.data.name, business_name: parsed.data.businessName },
    },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { message: "Check your inbox to confirm your email, then sign in." };
  }
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/app?welcome=1");
}

export async function signInWithGoogle(next?: string): Promise<AuthActionResult> {
  if (!isSupabaseConfigured) {
    return { error: "Google sign-in is not available in demo mode." };
  }
  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
  });
  if (error || !data.url) return { error: error?.message ?? "Could not start Google sign-in" };
  redirect(data.url);
}

export async function requestPasswordReset(values: ForgotPasswordValues): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const origin = await requestOrigin();
    const { error } = await supabase!.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/app/settings`,
    });
    if (error) return { error: error.message };
  }
  return {
    message: `If an account exists for ${parsed.data.email}, a reset link is on its way.`,
  };
}

export async function signOut(): Promise<never> {
  (await cookies()).delete(DEMO_COOKIE);
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }
  redirect("/");
}
