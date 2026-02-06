"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type PopularMerchant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  topCouponTitle?: string;
};

export default function HomeMerchantSliderClient({ merchants }: { merchants: PopularMerchant[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || merchants.length === 0) return;

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    let maxScroll = container.scrollWidth - container.clientWidth;
    let lastRecalcTime = Date.now();
    const RECALC_INTERVAL = 1000;

    const performScroll = () => {
      if (!container || isPausedRef.current) return;

      const currentScroll = container.scrollLeft;
      const now = Date.now();
      if (now - lastRecalcTime > RECALC_INTERVAL) {
        maxScroll = container.scrollWidth - container.clientWidth;
        lastRecalcTime = now;
      }

      if (currentScroll >= maxScroll - 1) {
        container.scrollLeft = 0;
        maxScroll = container.scrollWidth - container.clientWidth;
        lastRecalcTime = now;
      } else {
        container.scrollLeft = currentScroll + 1;
      }
    };

    scrollIntervalRef.current = setInterval(performScroll, 16);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [merchants]);

  const duplicatedMerchants = [...merchants, ...merchants];

  return (
    <div className="relative overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide"
        style={{
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
      >
        {duplicatedMerchants.map((merchant, index) => (
          <Link
            key={`${merchant.id}-${index}`}
            href={`/shop/${merchant.slug}`}
            className="merchant-item flex-shrink-0 text-center group cursor-pointer w-[140px] sm:w-[160px] md:w-[180px] flex flex-col items-center"
          >
            <img
              src={merchant.logoUrl}
              alt={merchant.name}
              width={96}
              height={96}
              className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg object-cover bg-white group-hover:shadow-xl transition-shadow"
              loading={index < 6 ? "eager" : "lazy"}
            />
            <span className="merchant-name font-semibold text-gray-800 text-xs sm:text-sm mb-1 md:mb-2">{merchant.name}</span>
            <span className="coupon-title text-xs text-gray-600 leading-tight px-1 sm:px-2">
              {merchant.topCouponTitle || ""}
            </span>
          </Link>
        ))}
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
}
