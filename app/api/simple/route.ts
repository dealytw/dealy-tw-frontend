import { NextResponse } from 'next/server';
import { mediaFrom } from '@/lib/media';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    
    console.log('Simple test - Environment check:', {
      API,
      hasToken: !!TOKEN,
      MARKET
    });
    
    const response = await fetch(`${API}/api/home-pages?filters[market][key][$eq]=${MARKET}&populate[hero][populate]=background`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Raw Strapi data received');
    
    const hp = data.data?.[0];
    if (!hp) {
      throw new Error(`No homepage found for market: ${MARKET}`);
    }
    
    const rawHero = hp.hero;
    if (!rawHero?.background?.data?.attributes?.url) {
      throw new Error("CMS error: HomePage.hero.background is required but missing.");
    }
    
    const hero = {
      bgUrl: mediaFrom(rawHero.background),
      title: rawHero.title,
      subtitle: rawHero.subtitle,
      description: rawHero.description,
      searchPlaceholder: rawHero.search_placeholder,
    };
    
    console.log('Hero mapped successfully:', { bgUrl: hero.bgUrl });
    
    return NextResponse.json({
      seo: {
        title: hp.title || hero.title,
        description: hero.description
      },
      hero: {
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        bgUrl: hero.bgUrl,
        searchPlaceholder: hero.searchPlaceholder
      },
      popularMerchants: {
        heading: "台灣最新折扣優惠",
        items: []
      },
      categoryBlock: {
        heading: "2025優惠主題一覽",
        categories: [],
        disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"
      },
      couponRail: {
        heading: "今日最新最受歡迎優惠券/Promo Code/優惠碼",
        items: []
      }
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json(
      { 
        error: 'Simple test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
