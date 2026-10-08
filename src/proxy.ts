import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_COOKIE, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const hasDemoSession = request.cookies.has(DEMO_COOKIE);

  if (!isSupabaseConfigured) {
    if (isAppRoute && !hasDemoSession) return redirectToLogin(request);
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(cacheHeaders ?? {})) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (isAppRoute && !data.user && !hasDemoSession) return redirectToLogin(request);
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth/:path*", "/login", "/signup"],
};
