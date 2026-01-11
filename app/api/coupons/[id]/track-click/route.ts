import { NextRequest, NextResponse } from 'next/server';
import { strapiFetch } from '@/lib/strapi.server';

const STRAPI_URL = process.env.STRAPI_URL || 'https://cms.dealy.tw';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

function noContent() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      // Tracking endpoints should never be cached.
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // IMPORTANT: Tracking should never fail user flows.
  // Always return 204 immediately; treat Strapi update as best-effort.
  void (async () => {
    try {
      const { id } = await params;
      if (!id) return;

      // Don't block on payload parsing. Accept any beacon payload (JSON/text/empty).
      // Note: we intentionally ignore the body for now.
      // await request.text().catch(() => '');

      // If missing credentials, skip silently.
      if (!STRAPI_TOKEN) return;

      // Fetch current coupon to get existing user_count (best-effort)
      const couponResponse = await strapiFetch<{ data: any }>(
        `/api/coupons/${id}?fields[0]=user_count`,
        {
          revalidate: 0, // Don't cache this request
          tags: [`coupon:${id}`],
        }
      );

      const currentUserCount = Number(couponResponse?.data?.user_count || 0) || 0;
      const newUserCount = currentUserCount + 1;

      // Update coupon with incremented user_count.
      // The CMS middleware will automatically recalculate display_count.
      await fetch(`${STRAPI_URL}/api/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({
          data: { user_count: newUserCount },
        }),
        cache: 'no-store',
      }).catch(() => {
        // Swallow network errors.
      });
    } catch (e) {
      // Never throw from tracking.
      console.warn('[track-click] best-effort update failed');
    }
  })();

  return noContent();
}

