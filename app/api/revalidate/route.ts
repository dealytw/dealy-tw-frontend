import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { warmPaths } from '@/lib/warm';
import { strapiFetch, qs } from '@/lib/strapi.server';

export const preferredRegion = ['sin1']; // Singapore (close to Strapi)
export const dynamic = 'force-dynamic'; // never cache this route

const ORIGIN = 'https://dealy.tw';
const DAILY_MARKET = 'tw';

const DAILY_KEY_PATHS = ['/', '/shop', '/special-offers', '/shop-sitemap.xml'];

const WARM_TOP_PATHS = [
  '/',
  '/shop',
  '/special-offers',
  '/shop/taobao',
  '/shop/chow-sang-sang',
  '/shop/ugg',
  '/shop/lg',
  '/shop/trip-com',
  '/shop/farfetch',
  '/shop/it',
  '/shop/olive-young-global',
  '/shop/kkday',
  '/shop/klook',
  '/shop/agoda',
  '/shop/adidas-hk',
  '/shop/lenovo',
  '/shop/casetify',
  '/shop/fortress',
  '/shop/sasa',
  '/shop/end-clothing',
  '/shop/estee-lauder',
  '/shop/la-mer',
  '/shop/catalog',
];

function buildDailyPaths(slugs: string[]) {
  return Array.from(
    new Set([
      ...DAILY_KEY_PATHS,
      ...slugs.map((slug) => `/shop/${slug}`),
    ])
  );
}

async function revalidateDailyMerchants() {
  const merchantParams = {
    "filters[market][key][$eq]": DAILY_MARKET,
    "filters[publishedAt][$notNull]": "true",
    "fields[0]": "page_slug",
    "pagination[pageSize]": "500",
  };

  const merchantsData = await strapiFetch<{ data: any[] }>(
    `/api/merchants?${qs(merchantParams)}`,
    { revalidate: 0 }
  );

  const slugs = (merchantsData?.data || [])
    .map((merchant: any) => String(merchant.page_slug || merchant.slug || '').trim())
    .filter(Boolean);

  for (const slug of slugs) {
    revalidateTag(`merchant:${slug}`);
    revalidatePath(`/shop/${slug}`);
  }

  revalidateTag('sitemap:merchants');
  revalidatePath('/shop-sitemap.xml');
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/special-offers');

  return { totalMerchants: slugs.length, slugs };
}

function isCronRequest(req: NextRequest): boolean {
  return req.headers.has('x-vercel-cron');
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const daily = req.nextUrl.searchParams.get('daily');
  const purge = req.nextUrl.searchParams.get('purge') === '1';
  const warmTop = req.nextUrl.searchParams.get('warmTop') === '1';

  if (!isCronRequest(req) && secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
  }

  if (warmTop) {
    const warm = await warmPaths(WARM_TOP_PATHS, {
      origin: process.env.PUBLIC_SITE_ORIGIN || ORIGIN,
      concurrency: 5,
      timeoutMs: 10000,
      retries: 2,
    });
    return NextResponse.json({ ok: warm.ok, mode: 'warmTop', warmed: warm.warmed.length, failed: warm.failed.length });
  }

  if (daily !== '1') {
    return NextResponse.json({ ok: false, error: 'Missing daily=1' }, { status: 400 });
  }

  const result = await revalidateDailyMerchants();

  if (purge) {
    const dailyPaths = buildDailyPaths(result.slugs || []);
    if (dailyPaths.length) {
      await purgeCF(dailyPaths.map((path) => `${ORIGIN}${path}`));
      await warmPaths(dailyPaths, {
        origin: process.env.PUBLIC_SITE_ORIGIN || ORIGIN,
        concurrency: 3,
        timeoutMs: 10000,
        retries: 2,
      });
    }
  }

  return NextResponse.json({ ok: true, mode: 'daily', purged: purge, ...result });
}

async function purgeCF(urls: string[]) {
  if (!process.env.CF_API_TOKEN || !process.env.CF_ZONE_ID) return;
  
  try {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: urls })
    });
  } catch (error) {
    console.error('Cloudflare purge failed:', error);
  }
}

async function purgeCFEverything() {
  if (!process.env.CF_API_TOKEN || !process.env.CF_ZONE_ID) return;
  try {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ purge_everything: true })
    });
  } catch (error) {
    console.error('Cloudflare purge-everything failed:', error);
  }
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { 
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  const { paths = [], tags = [], purge = false, purgeEverything = false } = await req.json().catch(() => ({}));

  // If purgeEverything is requested, execute immediately (no paths/tags required)
  if (purgeEverything) {
    await purgeCFEverything();
    return NextResponse.json({ ok: true, revalidated: { paths: [], tags: [] }, purged: true, scope: 'everything' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Validate inputs
  if (!Array.isArray(paths) && !Array.isArray(tags)) {
    return NextResponse.json({ ok: false, error: 'paths and tags must be arrays' }, { status: 400 });
  }

  // Revalidate tags FIRST (this invalidates cached data)
  // Tags are used by fetch() calls with the `tag` option
  for (const tag of tags) {
    if (typeof tag === 'string') {
      console.log(`[REVALIDATE] Revalidating tag: ${tag}`);
      revalidateTag(tag);
    }
  }

  // Revalidate paths SECOND (this invalidates the rendered page)
  // Use simple revalidatePath() like category pages do - it works for all route types
  for (const path of paths) {
    if (typeof path === 'string' && path.startsWith('/')) {
      console.log(`[REVALIDATE] Revalidating path: ${path}`);
      revalidatePath(path);
    }
  }

  let purged = false;
  const uniqueWarmPaths = Array.from(new Set(paths.filter((p: unknown) => typeof p === 'string' && (p as string).startsWith('/')))) as string[];

  if (purgeEverything) {
    await purgeCFEverything();
    return NextResponse.json({ ok: true, revalidated: { paths, tags }, purged: true, scope: 'everything' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (purge && uniqueWarmPaths.length > 0) {
    const urls = uniqueWarmPaths.map(path => `${ORIGIN}${path}`);
    await purgeCF(urls);
    purged = true;
    console.log(`[REVALIDATE] Warming ${uniqueWarmPaths.length} paths (canonical URLs) to populate CF...`);
    const warm = await warmPaths(uniqueWarmPaths, {
      origin: process.env.PUBLIC_SITE_ORIGIN || ORIGIN,
      concurrency: 3,
      timeoutMs: 10000,
      retries: 2,
    });
    if (!warm.ok) {
      console.error(`[REVALIDATE] Post-purge warm failed:`, warm);
    }
  }

  return NextResponse.json({ 
    ok: true, 
    revalidated: { paths, tags },
    purged: purged && paths.length > 0
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}