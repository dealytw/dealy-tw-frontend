// src/lib/strapi.ts
const BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || "").replace(/\/$/, "");
const TOKEN = process.env.STRAPI_TOKEN; // server-only

function assertBase() {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_STRAPI_URL");
  if (BASE.includes(".media.strapiapp.com")) {
    throw new Error("Use API domain, not the media CDN (e.g. https://<project>.strapiapp.com)");
  }
}

export async function strapiGet(path: string, params?: Record<string, string>) {
  assertBase();
  const url =
    BASE + path + (params ? `?${new URLSearchParams(params).toString()}` : "");
  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strapi ${res.status} ${res.statusText}\nURL: ${url}\n${text.slice(0, 600)}`);
  }
  return res.json();
}

export function absolutizeMedia(u?: string | null) {
  if (!u) return "";
  return u.startsWith("http") ? u : `${BASE}${u}`;
}

export function buildHomepageParams(marketKey: string) {
  return {
    "filters[market][key][$eq]": marketKey,
    "populate[hero][populate]": "background",     // <- must match your field name
    "populate[category][populate][merchants][populate]": "logo",
    "populate[coupon][populate][merchants][populate]": "logo",
    "populate[category][populate][categories]": "true",
    "populate[topicpage][populate]": "topics",
    "populate[market]": "true",
    "pagination[pageSize]": "1",
    "fields": "title,seo_title,seo_description",
  } as Record<string, string>;
}

export async function getHomePageByMarketKey(marketKey: string) {
  const json = await strapiGet("/api/home-pages", buildHomepageParams(marketKey));
  return json?.data?.[0] ?? null;
}