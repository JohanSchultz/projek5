import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import {
  DEFAULT_PASSWORD_RESET_PATH,
  hasAuthCallbackParams,
} from "@/lib/auth-redirect";

const PUBLIC_PATHS = ["/login", "/auth"];

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export async function updateSession(request) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSupabaseEnv()) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );

    if (isPublicPath) {
      return NextResponse.next({ request });
    }

    return new NextResponse(
      "Application misconfigured: Supabase environment variables are not set.",
      { status: 503 }
    );
  }

  if (
    hasAuthCallbackParams(request.nextUrl.searchParams) &&
    !pathname.startsWith("/auth/callback")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";

    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", DEFAULT_PASSWORD_RESET_PATH);
    }

    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Proxy session error:", error);

    if (isPublicPath) {
      return NextResponse.next({ request });
    }

    return new NextResponse("Authentication service unavailable.", {
      status: 503,
    });
  }
}
