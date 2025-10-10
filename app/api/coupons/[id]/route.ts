import { NextRequest, NextResponse } from 'next/server';
// import { getCouponBySlug } from '@/data/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    // Use the centralized query
    // const coupon = await getCouponBySlug(id);
    const coupon = null; // Temporarily disabled
    
    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(coupon);
    
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
