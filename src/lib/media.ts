export const STRAPI_BASE =
  (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");

export function mediaUrl(u?: string | null): string {
  if (!u) return "";
  return u.startsWith("http") ? u : `${STRAPI_BASE}${u}`;
}

export function mediaFrom(m: any): string {
  const url = m?.data?.attributes?.url || m?.url || "";
  return mediaUrl(url);
}
