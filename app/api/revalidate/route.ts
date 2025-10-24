import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

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

  const { paths = [], tags = [], purge = false } = await req.json().catch(() => ({}));

  // Validate inputs
  if (!Array.isArray(paths) && !Array.isArray(tags)) {
    return NextResponse.json({ ok: false, error: 'paths and tags must be arrays' }, { status: 400 });
  }

  // Revalidate paths
  for (const path of paths) {
    if (typeof path === 'string' && path.startsWith('/')) {
      revalidatePath(path);
    }
  }

  // Revalidate tags
  for (const tag of tags) {
    if (typeof tag === 'string') {
      revalidateTag(tag);
    }
  }

  // Optional: Purge Cloudflare cache for instant freshness
  let purged = false;
  if (purge && paths.length > 0) {
    const urls = paths
      .filter(path => typeof path === 'string' && path.startsWith('/'))
      .map(path => `${ORIGIN}${path}`);
    
    if (urls.length > 0) {
      await purgeCF(urls);
      purged = true;
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