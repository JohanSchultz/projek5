export const DEFAULT_PASSWORD_RESET_PATH = "/login/reset-password";

// Must match Supabase Authentication > URL Configuration:
// Site URL: https://projek5-theta.vercel.app
// Redirect URLs: http://localhost:3000/** and https://projek5-theta.vercel.app/**
export const PRODUCTION_SITE_URL = "https://projek5-theta.vercel.app";
export const LOCAL_SITE_URL = "http://localhost:3000";

export function getAuthCallbackUrl(nextPath = DEFAULT_PASSWORD_RESET_PATH) {
  const origin = getSiteOrigin();
  const next = encodeURIComponent(nextPath);
  return `${origin}/auth/callback?next=${next}`;
}

export function getSiteOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  return LOCAL_SITE_URL;
}

export function hasAuthCallbackParams(searchParams) {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  return Boolean(code || (tokenHash && type));
}
