import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { warmPaths } from '@/lib/warm';
import { setTimeout as sleep } from 'node:timers/promises';

export const preferredRegion = ['sin1']; // Singapore (close to Strapi)
export const dynamic = 'force-dynamic'; // never cache this route

const ORIGIN = 'https://dealy.tw';

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

  // Optional: Purge Cloudflare cache for instant freshness
  // Warm origin HTML before purge to avoid edge fetching stale
  let purged = false;
  const uniqueWarmPaths = Array.from(new Set(paths.filter((p: unknown) => typeof p === 'string' && (p as string).startsWith('/')))) as string[];
  if (uniqueWarmPaths.length) {
    console.log(`[REVALIDATE] Warming ${uniqueWarmPaths.length} paths to trigger ISR regeneration...`);
    const warm = await warmPaths(uniqueWarmPaths, {
      origin: process.env.PUBLIC_SITE_ORIGIN || ORIGIN,
      concurrency: 3,
      timeoutMs: 10000, // Increased timeout for blog pages with long revalidate times
      retries: 2,
    });
    if (!warm.ok) {
      console.error(`[REVALIDATE] Warming failed:`, warm);
      return NextResponse.json(
        { ok: false, warmed: warm },
        {
          status: 206,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
    console.log(`[REVALIDATE] Warming successful, waiting for ISR rebuilds...`);
    // Wait longer for ISR rebuilds to complete (especially for blog pages with 30-day revalidate)
    // Blog pages may take longer to regenerate due to their long revalidate time
    await sleep(5000); // Increased from 3s to 5s for blog pages
    console.log(`[REVALIDATE] ISR rebuild wait complete`);
  }

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
    
    // Warm again after purge so Cloudflare caches the fresh pages
    await warmPaths(uniqueWarmPaths, {
      origin: process.env.PUBLIC_SITE_ORIGIN || ORIGIN,
      concurrency: 3,
      timeoutMs: 4000,
      retries: 2,
    });
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