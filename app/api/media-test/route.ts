import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the mediaFrom function directly
    const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
    
    const mediaFrom = (m: any) => {
      const url = m?.data?.attributes?.url || m?.url || "";
      return url.startsWith("http") ? url : `${STRAPI}${url}`;
    };
    
    // Test with sample data
    const testMedia = {
      data: {
        attributes: {
          url: "/uploads/backgroundtest1_889da6818b.webp"
        }
      }
    };
    
    const result = mediaFrom(testMedia);
    
    return NextResponse.json({
      STRAPI,
      testMedia,
      result,
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Media test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
