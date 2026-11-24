export const ROODIES_ADMIN_EMAIL = "admin@ngkroodekrans.co.za";

export function isRoodiesAdmin(email) {
  return email?.toLowerCase() === ROODIES_ADMIN_EMAIL.toLowerCase();
}

export function getPostSignInPath(email, appNumber) {
  if (appNumber === 1) {
    return isRoodiesAdmin(email) ? "/menu_roodies" : "/menu";
  }

  if (appNumber === 2) {
    return "/konsensus";
  }

  return null;
}