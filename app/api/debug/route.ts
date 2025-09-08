import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    
    console.log('Environment check:', {
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
    console.log('Raw Strapi data:', JSON.stringify(data, null, 2));
    
    // Extract hero background URL
    const heroBackground = data.data?.[0]?.hero?.background?.data?.attributes?.url;
    console.log('Hero background URL:', heroBackground);
    
    return NextResponse.json({
      success: true,
      heroBackground,
      fullData: data
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
