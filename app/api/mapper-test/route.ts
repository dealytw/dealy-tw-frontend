import { NextResponse } from 'next/server';
import { mapHero } from '@/lib/mappers';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    
    console.log('Testing new mappers approach');
    
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
    
    const hero = mapHero(hp.hero);
    console.log('Hero mapped with new approach:', { bgUrl: hero.bgUrl, title: hero.title });
    
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
    console.error('Mapper test error:', error);
    return NextResponse.json(
      { 
        error: 'Mapper test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
