import { NextRequest, NextResponse } from 'next/server';
// import { getShopBySlug } from '@/data/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    // Use the centralized query
    // const merchant = await getShopBySlug(id);
    const merchant = null; // Temporarily disabled
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(merchant);
    
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}