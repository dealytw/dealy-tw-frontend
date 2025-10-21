import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Test a very simple query first
    const params = {
      "pagination[page]": "1",
      "pagination[pageSize]": "2",
    };

    console.log('Testing simple Strapi query with params:', params);
    
    const merchantsData = await strapiFetch(`/api/merchants?${qs(params)}`, {
      revalidate: 0,
      tag: 'debug',
    });
    
    return NextResponse.json({
      message: "Simple Strapi query successful",
      params: params,
      query_url: `/api/merchants?${qs(params)}`,
      merchants_count: merchantsData?.data?.length || 0,
      first_merchant: merchantsData?.data?.[0] || null,
      meta: merchantsData?.meta || null,
    });
  } catch (error: any) {
    console.error('Simple Strapi query error:', error);
    return NextResponse.json(
      { 
        error: "Simple Strapi query failed", 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
