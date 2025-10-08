import { NextResponse } from "next/server";
import { getCouponsForMerchant } from "@/lib/coupon-queries";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const marketKey = searchParams.get("market") || "tw";
    
    const coupons = await getCouponsForMerchant(params.id, marketKey);
    
    return NextResponse.json({
      ok: true,
      data: coupons,
    });
  } catch (error) {
    console.error("API /merchants/[id]/coupons error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
