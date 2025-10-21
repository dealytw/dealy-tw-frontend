import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get one merchant with all fields to see the structure
    const params = {
      "pagination[page]": "1",
      "pagination[pageSize]": "1",
    };

    const merchantsData = await strapiFetch(`/api/merchants?${qs(params)}`, {
      revalidate: 0,
      tag: 'debug',
    });
    
    const merchant = merchantsData?.data?.[0];
    
    return NextResponse.json({
      message: "Merchant structure analysis",
      merchant_fields: merchant ? Object.keys(merchant) : [],
      merchant_data: merchant,
      has_market_field: merchant ? 'market' in merchant : false,
    });
  } catch (error: any) {
    console.error('Merchant structure analysis error:', error);
    return NextResponse.json(
      { 
        error: "Merchant structure analysis failed", 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
