import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    
    // Inline media function
    const STRAPI_BASE = API.replace(/\/$/, "");
    const mediaFrom = (m: any): string => {
      const url = m?.data?.attributes?.url || m?.url || "";
      return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
    };
    
    const response = await fetch(`${API}/api/home-pages?filters[market][key][$eq]=${MARKET}&populate[hero][populate]=background`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const hp = data.data?.[0];
    
    if (!hp) {
      throw new Error(`No homepage found for market: ${MARKET}`);
    }
    
    const rawHero = hp.hero;
    const hero = {
      bgUrl: mediaFrom(rawHero?.background),
      title: rawHero?.title ?? "",
      subtitle: rawHero?.subtitle ?? "",
      description: rawHero?.description ?? "",
      searchPlaceholder: rawHero?.search_placeholder ?? "",
    };
    
    return NextResponse.json({
      success: true,
      hero: {
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        bgUrl: hero.bgUrl,
        searchPlaceholder: hero.searchPlaceholder
      },
      rawHero: hp.hero,
      backgroundData: hp.hero?.background
    });
  } catch (error) {
    console.error('Hero test error:', error);
    return NextResponse.json(
      { 
        error: 'Hero test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
