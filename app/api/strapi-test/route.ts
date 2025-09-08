import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    
    console.log('Testing getHomePageByMarketKey logic');
    
    const p = new URLSearchParams();
    p.set("filters[market][key][$eq]", MARKET);
    p.set("pagination[pageSize]", "1");
    p.set("fields", "title,seo_title,seo_description");
    p.set("populate[hero][populate]", "background");
    p.set("populate[hero][fields]", "title,subtitle,description,search_placeholder");
    p.set("populate[popularstore][populate]", "merchants");
    p.set("populate[category][populate]", "categories");
    p.set("populate[coupon][populate]", "merchants");
    p.set("populate[market]", "true");
    
    const res = await fetch(`${API}/api/home-pages?${p.toString()}`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
      next: { revalidate: 120 },
    });
    
    if (!res.ok) {
      throw new Error(`Homepage fetch failed: ${res.status} ${res.statusText}`);
    }
    
    const { data } = await res.json();
    console.log('Homepage API response received');
    
    const hp = data?.[0] ?? null;
    console.log('Homepage data extracted:', !!hp);
    
    if (!hp) {
      throw new Error(`No homepage found for market: ${MARKET}`);
    }
    
    const rawHero = hp.hero;
    if (!rawHero?.background?.data?.attributes?.url) {
      throw new Error("CMS error: HomePage.hero.background is required but missing.");
    }
    
    const STRAPI = API.replace(/\/$/, "");
    const mediaFrom = (m: any) => {
      const url = m?.data?.attributes?.url || m?.url || "";
      return url.startsWith("http") ? url : `${STRAPI}${url}`;
    };
    
    const hero = {
      bgUrl: mediaFrom(rawHero.background),
      title: rawHero.title,
      subtitle: rawHero.subtitle,
      description: rawHero.description,
      searchPlaceholder: rawHero.search_placeholder,
    };
    
    console.log('Hero mapped successfully');
    
    return NextResponse.json({
      success: true,
      hero: {
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        bgUrl: hero.bgUrl,
        searchPlaceholder: hero.searchPlaceholder
      }
    });
  } catch (error) {
    console.error('Strapi test error:', error);
    return NextResponse.json(
      { 
        error: 'Strapi test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
