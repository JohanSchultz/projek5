import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function createRouteHandlerClient(request, response) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/login/reset-password";

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createRouteHandlerClient(request, response);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Server exchange can fail for PKCE recovery; let the client try.
      const fallback = new URL(`${origin}${next}`);
      fallback.searchParams.set("code", code);
      return NextResponse.redirect(fallback);
    }

    return response;
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return response;
}
