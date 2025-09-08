import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { revalidateShop, revalidateCoupons } from '@/data/queries';

export async function POST(request: NextRequest) {
  try {
    // Verify the revalidation token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedToken = process.env.NEXT_REVALIDATE_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid revalidation token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { type, slug, collection, id } = body;
    
    // Revalidate based on the type of content that changed
    switch (type) {
      case 'merchant':
      case 'shop':
        if (slug) {
          revalidatePath(`/merchant/${slug}`);
          const tags = await revalidateShop(slug);
          tags.forEach(tag => revalidateTag(tag));
        }
        break;
        
      case 'coupon':
        revalidateTag('coupon:list');
        revalidateTag('coupon:search');
        // Revalidate merchant pages that might show this coupon
        if (collection === 'merchants' && id) {
          const couponTags = await revalidateCoupons(id);
          couponTags.forEach(tag => revalidateTag(tag));
        }
        break;
        
      case 'topic':
        revalidateTag('topic:list');
        if (slug) {
          revalidatePath(`/topic/${slug}`);
          revalidateTag(`topic:${slug}`);
        }
        break;
        
      default:
        // Revalidate all pages if type is not specified
        revalidatePath('/', 'layout');
        break;
    }
    
    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      type,
      slug
    });
    
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
