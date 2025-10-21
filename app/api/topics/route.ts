import { NextRequest, NextResponse } from 'next/server';
import { strapiFetch, qs } from '@/lib/strapi.server';

export const runtime = 'nodejs';
export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Try the most basic request first
    const queryString = '';
    console.log('Topics API: Fetching with query:', queryString);

    // Try with API token authentication first
    const response = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/special-offers?${queryString}`,
      { 
        revalidate: 300,
        tag: 'special-offers'
      }
    );

    const data = response;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Topics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}