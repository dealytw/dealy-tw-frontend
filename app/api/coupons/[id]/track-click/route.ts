import { NextRequest, NextResponse } from 'next/server';
import { strapiFetch } from '@/lib/strapi.server';

const STRAPI_URL = process.env.STRAPI_URL || 'https://cms.dealy.tw';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Fetch current coupon to get existing user_count
    let couponResponse;
    try {
      couponResponse = await strapiFetch<{ data: any }>(
        `/api/coupons/${id}?fields[0]=user_count`,
        { 
          revalidate: 0, // Don't cache this request
          tags: [`coupon:${id}`]
        }
      );
    } catch (fetchError: any) {
      // Handle 404 (coupon not found) gracefully - return 404 instead of 500
      if (fetchError?.status === 404 || (fetchError instanceof Error && fetchError.message.includes('404'))) {
        console.warn(`[track-click] Coupon ${id} not found (404)`);
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        );
      }
      // Re-throw other errors to be handled by outer catch
      throw fetchError;
    }

    const currentUserCount = couponResponse?.data?.user_count || 0;
    const newUserCount = currentUserCount + 1;

    // Update coupon with incremented user_count
    // The CMS middleware will automatically recalculate display_count
    const updateResponse = await fetch(`${STRAPI_URL}/api/coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          user_count: newUserCount,
        }
      }),
      cache: 'no-store',
    });

    if (!updateResponse.ok) {
      // Handle 404 on update (coupon deleted between fetch and update)
      if (updateResponse.status === 404) {
        console.warn(`[track-click] Coupon ${id} not found during update (404)`);
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to update coupon: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    return NextResponse.json({
      success: true,
      user_count: newUserCount,
    });
  } catch (error: any) {
    console.error('Error tracking coupon click:', error);
    
    // If it's a 404 error, return 404 instead of 500
    if (error?.status === 404 || (error instanceof Error && error.message.includes('404'))) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    // For other errors, return 500
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

