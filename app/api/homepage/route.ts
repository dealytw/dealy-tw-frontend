// app/api/homepage/route.ts
import { NextResponse } from "next/server";
import { getHomePageData } from "@/lib/homepage-loader";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
    const data = await getHomePageData(MARKET);
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("API /homepage error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error", stack: err?.stack },
      { status: 500 }
    );
  }
}