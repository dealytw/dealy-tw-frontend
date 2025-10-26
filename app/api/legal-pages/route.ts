import { NextRequest, NextResponse } from 'next/server';
import { strapiFetch } from '@/lib/strapi.server';
import qs from 'qs';

export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
    
    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = {
      "filters[slug][$eq]": slug,
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "content",
      "fields[3]": "slug",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
    };

    const response = await strapiFetch<{ data: any[] }>(
      `/api/legal-pages?${qs(queryParams)}`,
      { revalidate: 3600, tag: `legal-page:${slug}` }
    );

    if (!response?.data || response.data.length === 0) {
      return NextResponse.json(
        { error: "Legal page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data[0], {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error: any) {
    console.error("Error fetching legal page:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal page data" },
      { status: 500 }
    );
  }
}

