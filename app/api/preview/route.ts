import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const slug = searchParams.get('slug');
    const type = searchParams.get('type');
    
    // Verify the preview token
    const expectedToken = process.env.NEXT_PREVIEW_TOKEN;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid preview token' },
        { status: 401 }
      );
    }
    
    // Enable preview mode
    const response = NextResponse.redirect(
      new URL(`/${type}/${slug}`, request.url)
    );
    
    // Set preview mode cookies
    response.cookies.set('__prerender_bypass', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    });
    
    response.cookies.set('__next_preview_data', JSON.stringify({
      type,
      slug,
      timestamp: new Date().toISOString()
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    });
    
    return response;
    
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Preview failed' },
      { status: 500 }
    );
  }
}
