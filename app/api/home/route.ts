import { NextRequest, NextResponse } from 'next/server';
import { getHome } from '@/data/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draft = searchParams.get('draft') === 'true';
    
    // Use the centralized query
    const homeData = await getHome({ draft });
    
    return NextResponse.json(homeData);
    
  } catch (error) {
    console.error('Error fetching home data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
