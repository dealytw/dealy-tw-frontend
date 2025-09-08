// app/api/homepage/route.ts
import { NextResponse } from "next/server";
import { getHomePageData } from "@/lib/homepage-loader";

export const dynamic = "force-dynamic"; // ensure server fetch
export const revalidate = 0;

export async function GET() {
  try {
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    const data = await getHomePageData(MARKET);
    
    // Transform the simplified data to match the expected HomePageData structure
    const transformedData = {
      seo: {
        title: data.title || "Dealy.TW 台灣每日最新優惠折扣平台",
        description: "台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"
      },
      hero: {
        title: data.hero.title || data.title || "Dealy.TW 台灣每日最新優惠折扣平台",
        subtitle: data.hero.subtitle || "NEVER Pay Full Price",
        description: "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡",
        bgUrl: data.hero.bgUrl,
        searchPlaceholder: "搜尋最抵Deal"
      },
      popularMerchants: {
        heading: "台灣最新折扣優惠",
        items: []
      },
      categoryBlock: {
        heading: "2025優惠主題一覽",
        categories: [],
        disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"
      },
      couponRail: {
        heading: "今日最新最受歡迎優惠券/Promo Code/優惠碼",
        items: []
      }
    };
    
    return NextResponse.json({ ok: true, data: transformedData });
  } catch (err: any) {
    console.error("API /homepage error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error", stack: err?.stack },
      { status: 500 }
    );
  }
}