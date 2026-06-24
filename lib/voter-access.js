export const VOTER_USER_EMAIL = "voters@gmail.com";

const VOTER_ALLOWED_PATH_PREFIXES = ["/konsensus", "/register", "/summary"];

export function isVoterUser(email) {
  return email?.toLowerCase() === VOTER_USER_EMAIL;
}

export function isPathAllowedForVoter(pathname) {
  return VOTER_ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function filterKonsensusTreeForVoter(tree) {
  const allowedHrefs = new Set(["/register", "/summary"]);

  return tree
    .map((node) => ({
      ...node,
      children: node.children?.filter(
        (child) => child.href && allowedHrefs.has(child.href)
      ),
    }))
    .filter((node) => node.children?.length);
}
