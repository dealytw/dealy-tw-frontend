// API route to proxy /upload/* requests to Strapi CDN
// Proxies requests transparently to Strapi's media CDN
import { NextRequest, NextResponse } from 'next/server';

const STRAPI_CDN = 'https://ingenious-charity-13f9502d24.media.strapiapp.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filename = path.join('/');
  
  // Proxy directly to Strapi CDN
  // The filename can be:
  // - Hashed: tripcom_5eff0330bd.webp (direct match)
  // - Clean: tripcom.webp (will need hash lookup - TODO: implement mapping)
  const strapiUrl = `${STRAPI_CDN}/${filename}`;
  
  try {
    const response = await fetch(strapiUrl, {
      headers: {
        'User-Agent': 'Dealy-Image-Proxy/1.0',
      },
      // Pass through cache headers from Strapi
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const contentType = response.headers.get('Content-Type') || 'image/webp';
      
      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          // Cache for 1 year (immutable assets)
          'Cache-Control': 'public, max-age=31536000, immutable',
          // Pass through other headers if needed
          ...(response.headers.get('ETag') && { 'ETag': response.headers.get('ETag')! }),
        },
      });
    } else {
      // If file not found, return 404
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('[upload-proxy] Error fetching from Strapi CDN:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

