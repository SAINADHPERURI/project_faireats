import "server-only";

export function isAllowedAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.toLowerCase());
}
