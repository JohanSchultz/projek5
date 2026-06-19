export const DEFAULT_PASSWORD_RESET_PATH = "/login/reset-password";

export function getAuthCallbackUrl(nextPath = DEFAULT_PASSWORD_RESET_PATH) {
  const origin = getSiteOrigin();
  return `${origin}${nextPath}`;
}

export function getSiteOrigin() {
  if (typeof window !== "undefined") {
    // Use the URL the user is actually on (localhost or Vercel).
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function hasAuthCallbackParams(searchParams) {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  return Boolean(code || (tokenHash && type));
}
