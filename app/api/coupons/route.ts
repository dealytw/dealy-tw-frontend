import { NextResponse } from "next/server";
import { getAllActiveCoupons } from "@/lib/coupon-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketKey = searchParams.get("market") || "tw";
    
    const coupons = await getAllActiveCoupons(marketKey);
    
    return NextResponse.json({
      ok: true,
      data: coupons,
    });
  } catch (error) {
    console.error("API /coupons error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
