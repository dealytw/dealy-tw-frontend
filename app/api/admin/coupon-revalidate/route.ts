import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { warmPaths } from '@/lib/warm';

export const preferredRegion = ['sin1'];   // near TW/Strapi
export const dynamic = 'force-dynamic';    // never cache

// Simple token auth (better: JWT/HMAC, see pitfalls)
function authorized(req: NextRequest) {
  const token = req.headers.get('x-admin-token') ?? '';
  return token === process.env.ADMIN_REVALIDATE_TOKEN;
}

// Batch helper: chunk an array
const chunk = <T,>(arr: T[], size = 50) =>
  arr.reduce<T[][]>((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);

async function purgeCF(urls: string[]) {
  if (!process.env.CF_API_TOKEN || !process.env.CF_ZONE_ID || urls.length === 0) return;
  
  // Chunk to avoid rate limits
  for (const group of chunk(urls, 30)) {
    try {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: group }),
      });
    } catch (error) {
      console.error('Cloudflare purge failed for group:', error);
    }
  }
}

export async function POST(req: NextRequest) {
  // CORS headers for admin app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  };

  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { 
      status: 401,
      headers: corsHeaders
    });
  }

  const { coupons = [], merchants = [], specialOffers = [], paths = [], tags = [], purge = false } =
    await req.json().catch(() => ({}));

  // From coupons → derive tags/paths so admin doesn't need to compute
  // Expect each coupon has merchantSlug, categorySlugs, and optional directPath.
  const derivedTags: string[] = [];
  const derivedPaths: string[] = [];

  // Handle merchants individually
  for (const m of merchants as Array<{slug: string}>) {
    if (m.slug) {
      derivedTags.push(`merchant:${m.slug}`);
      derivedPaths.push(`/shop/${m.slug}`);
    }
  }

  // Handle special offers individually
  for (const so of specialOffers as Array<{slug: string}>) {
    if (so.slug) {
      derivedTags.push(`special-offer:${so.slug}`);
      derivedPaths.push(`/special-offers/${so.slug}`);
    }
  }

  // Handle coupons → derive tags/paths
  for (const c of coupons as Array<{merchantSlug: string, categorySlugs: string[], path?: string}>) {
    if (c.merchantSlug) derivedTags.push(`merchant:${c.merchantSlug}`);
    if (Array.isArray(c.categorySlugs)) {
      for (const cat of c.categorySlugs) derivedTags.push(`category:${cat}`);
    }
    if (c.path) derivedPaths.push(c.path); // e.g. /special-offers/xyz
    // Always consider homepage/collections that list coupons:
    derivedTags.push('list:home', 'sitemap');
  }

  // De-dupe
  const allTags = Array.from(new Set([...tags, ...derivedTags]));
  const allPaths = Array.from(new Set([...paths, ...derivedPaths]));

  // Revalidate tags first (widest coverage), then specific paths
  for (const t of allTags) revalidateTag(t);
  for (const p of allPaths) revalidatePath(p);

  // Warm origin HTML before purge to avoid edge fetching stale
  let purged = false;
  if (allPaths.length) {
    const warm = await warmPaths(allPaths, {
      origin: process.env.PUBLIC_SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw',
      concurrency: 3,
      timeoutMs: 4000,
      retries: 2,
    });
    if (!warm.ok) {
      return NextResponse.json(
        { ok: false, warmed: warm },
        { status: 206, headers: corsHeaders }
      );
    }
  }

  if (purge && allPaths.length) {
    const base = process.env.PUBLIC_SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';
    await purgeCF(allPaths.map((p) => `${base}${p}`));
    purged = true;
  }

  return NextResponse.json({
    ok: true,
    counts: { tags: allTags.length, paths: allPaths.length },
    purged,
    revalidated: { tags: allTags, paths: allPaths }
  }, {
    headers: corsHeaders
  });
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
    },
  });
}
