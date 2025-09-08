import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_STRAPI_URL;
    const TOKEN = process.env.STRAPI_TOKEN;
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY;
    
    return NextResponse.json({
      API: API || 'NOT_SET',
      hasToken: !!TOKEN,
      MARKET: MARKET || 'NOT_SET',
      tokenLength: TOKEN ? TOKEN.length : 0
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Env test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
