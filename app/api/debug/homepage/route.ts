import { NextResponse } from "next/server";

const BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || "").replace(/\/$/, "");
const TOKEN = process.env.STRAPI_TOKEN;            // server-only
const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";

// If you accidentally set the MEDIA domain here, warn early
function assertBase() {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_STRAPI_URL env");
  if (BASE.includes(".media.strapiapp.com")) {
    throw new Error(
      `NEXT_PUBLIC_STRAPI_URL must be your API domain, not the media CDN.
       Example: https://<project>.strapiapp.com`
    );
  }
}

export async function GET() {
  try {
    assertBase();

    const qs = new URLSearchParams({
      "filters[market][key][$eq]": MARKET,
      "populate[hero][populate]": "background",
      "populate[popularstore][populate]": "merchants",
      "populate[coupon][populate]": "merchants",
      "populate[category][populate]": "categories",
      "populate[market]": "true",
      "pagination[pageSize]": "1",
      "fields": "title,seo_title,seo_description"
    });

    const url = `${BASE}/api/home-pages?${qs.toString()}`;
    const res = await fetch(url, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Strapi ${res.status} ${res.statusText}`, url, body: text.slice(0, 800) },
        { status: res.status }
      );
    }

    const json = await res.json();
    // Optional: validate hero media now so failures are obvious
    const hero = Array.isArray(json?.data?.[0]?.hero)
      ? json.data[0].hero[0]
      : json?.data?.[0]?.hero;

    const heroUrl = hero?.background?.url || "";
    return NextResponse.json({
      ok: true,
      url,
      heroUrl, // should be absolute URL from Strapi Cloud
      absoluteHeroUrl: heroUrl
        ? (heroUrl.startsWith("http") ? heroUrl : `${BASE}${heroUrl}`)
        : null,
      raw: json,
    });
  } catch (err: any) {
    console.error("API /debug/homepage error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error", stack: err?.stack },
      { status: 500 }
    );
  }
}