"use client";
import { useState, useEffect } from "react";
import DealyCouponCard from "@/components/DealyCouponCard";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Calendar, ArrowUp, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { TransformedShop } from "@/types/cms";
import CouponCard from "@/components/CouponCard";
import MerchantRating from "@/components/MerchantRating";

// Helper function to extract text from Strapi rich text
function extractTextFromRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => {
      if (item.children && Array.isArray(item.children)) {
        return item.children.map((child: any) => child.text || "").join("");
      }
      return item.text || "";
    }).join(" ");
  }
  return "";
}

// Helper function to render rich text with formatting preserved
function renderRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => {
      if (item.type === "paragraph") {
        let paragraphContent = "";
        if (item.children && Array.isArray(item.children)) {
          paragraphContent = item.children.map((child: any) => {
            if (child.bold) return `<strong>${child.text || ""}</strong>`;
            if (child.italic) return `<em>${child.text || ""}</em>`;
            return child.text || "";
          }).join("");
        } else {
          paragraphContent = item.text || "";
        }
        // Wrap paragraph content in <p> tag for proper line breaks
        return `<p>${paragraphContent}</p>`;
      }
      if (item.type === "list") {
        const listItems = item.children?.map((child: any) => {
          if (child.children && Array.isArray(child.children)) {
            return child.children.map((grandChild: any) => grandChild.text || "").join("");
          }
          return child.text || "";
        }).join("</li><li>") || "";
        return `<ul><li>${listItems}</li></ul>`;
      }
      return item.text || "";
    }).join(""); // Join without \n since we're using HTML tags now
  }
  return "";
}

interface MerchantProps {
  merchant: TransformedShop;
  coupons: any[];
  expiredCoupons: any[];
}

const MerchantCouponsClient = ({ merchant, coupons, expiredCoupons }: MerchantProps) => {

  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [scrolledToCouponId, setScrolledToCouponId] = useState<string | null>(null);
  const [expiredCouponDetails, setExpiredCouponDetails] = useState<Record<string, boolean>>({});
  const [showAllActiveCoupons, setShowAllActiveCoupons] = useState(false);
  const [showAllExpiredCoupons, setShowAllExpiredCoupons] = useState(false);
  const [isRegionExpanded, setIsRegionExpanded] = useState(false);
  
  // Remove duplicate coupons by ID to prevent duplicate rendering in HTML
  // This is a safety measure in case server-side deduplication didn't catch everything
  // Check both id and any other identifier to ensure proper deduplication
  const deduplicateCoupons = (couponList: any[]): any[] => {
    const seen = new Set<string>();
    return couponList.filter((coupon) => {
      // Try both id and any other identifier
      const couponId = coupon.id?.toString();
      const couponDocumentId = coupon.documentId?.toString();
      const primaryId = couponId || couponDocumentId;
      
      if (!primaryId) {
        console.warn('Skipping coupon without id or documentId:', coupon);
        return false;
      }
      
      // Check if we've seen this coupon by either id or documentId
      if (seen.has(primaryId) || (couponId && seen.has(couponId)) || (couponDocumentId && seen.has(couponDocumentId))) {
        console.warn('Skipping duplicate coupon in client:', { id: couponId, documentId: couponDocumentId, title: coupon.coupon_title });
        return false;
      }
      
      // Mark both IDs as seen
      if (couponId) seen.add(couponId);
      if (couponDocumentId) seen.add(couponDocumentId);
      seen.add(primaryId);
      
      return true;
    });
  };
  
  // Deduplicate coupons and expired coupons
  const uniqueCoupons = deduplicateCoupons(coupons || []);
  const uniqueExpiredCoupons = deduplicateCoupons(expiredCoupons || []);

  // Phase 2: "Top verified codes" table (max 5).
  // Codes are rendered in the initial HTML (ISR) but kept out of SERP snippets via data-nosnippet.
  const verifiedPromoCodes = uniqueCoupons
    .filter((c: any) => c?.coupon_type === "promo_code" && typeof c?.code === "string" && c.code.trim() && c?.affiliate_link)
    // Lowest priority number first (1 -> N)
    .sort((a: any, b: any) => Number(a?.priority ?? Infinity) - Number(b?.priority ?? Infinity))
    .slice(0, 5);

  // Verified code table UX:
  // - Click button: copy code + open affiliate link in new tab
  // - Button turns pale green and shows "已複製"
  const [verifiedCopiedById, setVerifiedCopiedById] = useState<Record<string, boolean>>({});

  const copyTextToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall back
    }
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', 'true');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  const handleVerifiedCodeClick = (id: string, code: string, href: string) => {
    if (typeof window === 'undefined') return;
    if (!href || href === '#') return;

    // Flip UI state immediately so the user sees "已複製" right away.
    // Also reset other rows so only the latest clicked one is highlighted.
    setVerifiedCopiedById({ [id]: true });

    try {
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }

    void copyTextToClipboard(code);
  };

  const formatExpiryDate = (expiresAt: any): string => {
    if (!expiresAt) return "長期有效";
    if (typeof expiresAt === "string") {
      // Prefer YYYY-MM-DD if it's an ISO string
      if (expiresAt.length >= 10) return expiresAt.slice(0, 10);
      return expiresAt;
    }
    try {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) return "長期有效";
      return d.toISOString().slice(0, 10);
    } catch {
      return "長期有效";
    }
  };
  
  // Determine which filters to show based on merchant settings
  // When location_filtering and creditcard_filtering are false (default), show simple filters
  const useSimpleFilters = !merchant.location_filtering && !merchant.creditcard_filtering;
  const filters = useSimpleFilters 
    ? ["全部", "折扣代碼", "優惠券", "相關店鋪"]
    : merchant.location_filtering && !merchant.creditcard_filtering
    ? ["全部", "精選地區", "信用卡優惠"]
    : !merchant.location_filtering && merchant.creditcard_filtering
    ? ["全部", "精選地區", "信用卡優惠"]
    : merchant.location_filtering && merchant.creditcard_filtering
    ? ["全部", "精選地區", "信用卡優惠"]
    : ["全部", "最新優惠", "日本", "韓國", "本地", "內地", "信用卡"];

  // Region filter keywords
  const regionKeywords: Record<string, string[]> = {
    "台灣": ["台灣"],
    "日本": ["日本"],
    "韓國": ["韓國"],
    "中港澳": ["中國", "內地", "香港", "澳門"],
    "東南亞": ["泰國", "越南", "馬來西亞", "新加坡"],
  };

  // Helper function to check if coupon title matches region
  const matchesRegion = (couponTitle: string, region: string): boolean => {
    if (region === "其他") {
      // Check if title doesn't match any of the defined regions
      const allKeywords = Object.values(regionKeywords).flat();
      return !allKeywords.some(keyword => couponTitle.includes(keyword));
    }
    const keywords = regionKeywords[region] || [];
    return keywords.some(keyword => couponTitle.includes(keyword));
  };

  // Helper function to check if coupon is a credit card offer
  const isCreditCardCoupon = (couponTitle: string): boolean => {
    const creditCardKeywords = [
      "信用卡", "VISA", "Mastercard", "萬事達", "Visa", "MASTERCARD",
      "信用卡優惠", "信用卡折扣", "信用卡回饋", "刷卡", "信用卡專屬",
      "VISA卡", "Mastercard卡", "萬事達卡", "Visa卡"
    ];
    return creditCardKeywords.some(keyword => couponTitle.includes(keyword));
  };

  // Reset showAllActiveCoupons when filter changes
  useEffect(() => {
    setShowAllActiveCoupons(false);
  }, [activeFilter, selectedRegion]);

  // Helper function to get button text based on coupon type
  const getButtonText = (couponType?: string) => {
    switch (couponType) {
      case "promo_code":
        return "獲取優惠碼";
      case "coupon":
        return "獲取優惠券";
      case "discount":
        return "獲取折扣";
      default:
        return "獲取優惠碼"; // Default fallback
    }
  };

  // Transform CMS coupons to DealyCouponCard format
  const transformCoupon = (coupon: any) => {
    // Add null safety checks
    if (!coupon) {
      console.error('transformCoupon: coupon is null or undefined');
      return null;
    }

    if (!coupon.merchant) {
      console.error('transformCoupon: coupon.merchant is missing', coupon.id);
      return null;
    }

    // Handle null/undefined values safely
    const value = coupon.value || '';
    // Enhanced regex to handle currencies: TWD, HKD, USD, etc. and symbols: $, ¥, €, etc.
    const currencyPattern = /(\d+)\s*(?:TWD|HKD|USD|EUR|JPY|CNY|SGD|MYR|THB|PHP|IDR|VND|KRW|INR|AUD|CAD|GBP|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RUB|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|ZAR|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|NGN|KES|UGX|TZS|ZMW|BWP|MWK|MZN|AOA|XOF|XAF|XPF|MUR|SCR|KMF|DJF|ERN|ETB|SOS|SLL|GMD|GNF|LRD|CDF|RWF|BIF|CVE|STN|SZL|LSL|NAD|BND|FJD|PGK|SBD|TOP|VUV|WST|TVD|KID|NPR|BTN|MVR|AFN|PKR|LKR|BDT|MMK|LAK|KHR|MOP)?\s*\$?\s*(%|折|off|減|扣|折|優惠)/i;
    const discountValue = value ? value.replace(currencyPattern, '$1') : '0';
    
    return {
      id: coupon.id,
      code: coupon.code || '',
      title: coupon.coupon_title || 'Untitled Coupon',
      description: extractTextFromRichText(coupon.description), // This will show in the main description area
      discount: value,
      discountValue: discountValue,
      expiry: coupon.expires_at || "長期有效",
      usageCount: coupon.display_count || coupon.user_count || 0, // Use display_count (calculated) instead of user_count (actual clicks)
      steps: renderRichText(coupon.description), // Map description to steps with formatting preserved
      terms: renderRichText(coupon.editor_tips), // Map editor_tips to terms with formatting preserved (⚠️ 溫馨提示)
      affiliateLink: coupon.affiliate_link || '#',
      coupon_type: coupon.coupon_type,
      merchant: {
        name: coupon.merchant.name || '',
        logo: coupon.merchant.logo || '',
      }
    };
  };

  // Auto scroll to coupon if hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#coupon-')) {
      // Handle multiple hash fragments by taking the last one
      const couponHashes = hash.match(/#coupon-(\d+)/g);
      if (couponHashes && couponHashes.length > 0) {
        const lastCouponHash = couponHashes[couponHashes.length - 1];
        const couponId = lastCouponHash.replace('#coupon-', '');
        const element = document.getElementById(`coupon-${couponId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Set the scrolled to coupon ID for promo_code display
          setScrolledToCouponId(couponId);

          // Find and open the corresponding coupon modal
          const coupon = uniqueCoupons.find(c => c.id === couponId) || uniqueExpiredCoupons.find(c => c.id === couponId);
          if (coupon) {
            // Transform the coupon for the modal using the same transformation
            const transformedCoupon = transformCoupon(coupon);
            if (transformedCoupon) {
              setSelectedCoupon(transformedCoupon);
              setIsModalOpen(true);
            }
          }
        }
      }
    }
  }, [coupons, expiredCoupons]);

  const handleCouponClick = (coupon: any) => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id.toString(),
        couponTitle: coupon.coupon_title,
        couponCode: coupon.code,
        merchantName: coupon.merchant?.name || merchant.name,
        merchantSlug: merchant.slug,
        affiliateLink: coupon.affiliate_link || '#',
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });

      // Parallel actions (no delays, no setTimeout)
      // Action 1: Open merchant page (new tab) with hash to auto-open modal & scroll
      const baseUrl = window.location.href.split('#')[0]; // Remove existing hash
      const merchantUrl = `${baseUrl}#coupon-${coupon.id}`;
      window.open(merchantUrl, '_blank', 'noopener,noreferrer');

      // Action 2: Redirect current tab to affiliate link (instant, no delay)
      if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
        window.location.href = coupon.affiliate_link;
      }
    }
  };

  return (
    <>
            {/* Latest verified codes (max 5 promo_code). Hide when none. */}
            {verifiedPromoCodes.length > 0 && (
              <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50/60 p-3">
                <div className="text-sm font-semibold text-gray-900">
                  最新已驗證{merchant.name}優惠碼
                </div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left text-gray-700">
                        <th className="py-1 pr-3 font-medium">
                          <span className="inline-flex items-center gap-1">
                            已驗證優惠
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <circle cx="10" cy="10" r="8.5" fill="#16A34A" opacity="0.14" />
                              <circle cx="10" cy="10" r="8.5" stroke="#16A34A" strokeWidth="1.2" />
                              <path d="m6.2 10.3 2.2 2.2 5.5-5.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </th>
                        <th className="py-1 pr-3 font-medium whitespace-nowrap">優惠碼</th>
                        <th className="py-1 font-medium whitespace-nowrap">到期日</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-900">
                      {verifiedPromoCodes.map((c: any) => {
                        const href = c.affiliate_link || "#";
                        const copied = !!verifiedCopiedById[String(c.id)];
                        return (
                          <tr key={`verified-code-${c.id}`} className="border-t border-yellow-200/60">
                            <td className="py-1 pr-3 align-top">
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="inline-flex items-start hover:underline leading-snug"
                              >
                                {c.coupon_title || "優惠碼"}
                              </a>
                            </td>
                            <td className="py-1 pr-3 align-top whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleVerifiedCodeClick(String(c.id), String(c.code || '').trim(), href)}
                                className={[
                                  "inline-flex items-center rounded-md border px-2 py-0.5 font-mono transition-colors",
                                  copied
                                    ? "border-green-200 bg-green-50 text-green-800"
                                    : "border-yellow-200 bg-white hover:bg-yellow-50",
                                ].join(" ")}
                                title="Click to copy"
                              >
                                <span data-nosnippet>{c.code}</span>
                                {copied && <span className="ml-2 font-sans text-[10px]">已複製</span>}
                              </button>
                              {/* Keep a crawlable outlink in HTML (not used for clicks). */}
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="sr-only"
                                aria-hidden="true"
                                tabIndex={-1}
                                data-nosnippet=""
                              >
                                {c.coupon_title || merchant.name}
                              </a>
                            </td>
                            <td className="py-1 align-top whitespace-nowrap text-gray-700">
                              {formatExpiryDate(c.expires_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Continued Content */}
            <div className="space-y-8">
              {/* Active Coupons Section */}
              <section
                id="active-coupons"
                aria-labelledby={`${merchant.slug}-active-heading`}
                className="mb-10"
              >
                <h2
                  id={`${merchant.slug}-active-heading`}
                  className="text-lg md:text-xl font-bold text-gray-900 mb-4"
                >
                  {merchant.name}優惠碼總整理 (每日更新) | Promo code/ Discount code
                </h2>
                
                {/* Filter Section */}
                <div className="mb-6">
                  <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 flex-nowrap">
                  {filters.map(filter => {
                    // Handle "精選地區" with expandable inline region selector
                    if (filter === "精選地區") {
                      return (
                        <div key={filter} className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant={activeFilter === filter && selectedRegion ? "default" : "outline"} 
                            className={`cursor-pointer px-3 py-1 text-sm flex items-center gap-1 transition-all flex-shrink-0 ${activeFilter === filter && selectedRegion ? "bg-blue text-white border-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                            onClick={() => {
                              setIsRegionExpanded(!isRegionExpanded);
                              if (!isRegionExpanded) {
                                setActiveFilter("精選地區");
                              }
                            }}
                          >
                            {filter}
                            {selectedRegion && `: ${selectedRegion}`}
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isRegionExpanded ? 'rotate-180' : ''}`} />
                          </Badge>
                          
                          {/* Expandable region list - slides to the right, can overflow viewport */}
                          <div 
                            className={`flex items-center gap-2 overflow-x-auto scrollbar-hide transition-all duration-300 ease-in-out ${
                              isRegionExpanded 
                                ? 'opacity-100' 
                                : 'max-w-0 opacity-0 overflow-hidden'
                            }`}
                            style={{
                              transition: 'max-width 0.3s ease-in-out, opacity 0.3s ease-in-out, margin 0.3s ease-in-out',
                              maxWidth: isRegionExpanded ? 'none' : '0',
                              minWidth: isRegionExpanded ? 'auto' : '0',
                            }}
                          >
                            {["台灣", "日本", "韓國", "中港澳", "東南亞", "其他"].map((region) => (
                              <Badge
                                key={region}
                                variant={selectedRegion === region ? "default" : "outline"}
                                className={`cursor-pointer px-3 py-1 text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                                  selectedRegion === region
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                  setActiveFilter("精選地區");
                                  setSelectedRegion(region);
                                  setIsRegionExpanded(false); // Close after selection
                                }}
                              >
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular filter buttons
                    return (
                      <Badge 
                        key={filter} 
                        variant={activeFilter === filter ? "default" : "outline"} 
                        className={`cursor-pointer px-3 py-1 text-sm flex-shrink-0 whitespace-nowrap ${activeFilter === filter ? "bg-blue text-white border-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`} 
                        onClick={() => {
                          setActiveFilter(filter);
                          setSelectedRegion(null); // Reset region when switching to other filters
                          setIsRegionExpanded(false); // Close region selector when clicking other filters
                          // If clicking "相關店鋪", scroll to related merchants section
                          if (filter === "相關店鋪") {
                            setTimeout(() => {
                              const relatedSection = document.getElementById('related-merchants-section');
                              if (relatedSection) {
                                relatedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }
                          // If clicking "信用卡優惠", scroll to credit card coupons section
                          if (filter === "信用卡優惠") {
                            setTimeout(() => {
                              const creditCardSection = document.getElementById('creditcard-active-coupons');
                              if (creditCardSection) {
                                creditCardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }
                        }}
                      >
                        {filter}
                      </Badge>
                    );
                  })}
                  </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {uniqueCoupons
                    .filter((coupon) => {
                      // Apply filtering based on activeFilter
                      if (useSimpleFilters) {
                        // When useSimpleFilters is true, creditcard_filtering is false
                        // So credit card coupons should show normally in all filters
                        switch (activeFilter) {
                          case "全部":
                            return true; // Show all coupons
                          case "折扣代碼":
                            return coupon.coupon_type === "promo_code";
                          case "優惠券":
                            return coupon.coupon_type !== "promo_code";
                          case "相關店鋪":
                            return false; // This will be handled separately, don't show coupons here
                          default:
                            return true;
                        }
                      } else {
                        // Advanced filtering logic (when location_filtering or creditcard_filtering is true)
                        switch (activeFilter) {
                          case "全部":
                            // Only exclude credit card coupons if creditcard_filtering is enabled
                            // They will be shown in the separate credit card section
                            if (merchant.creditcard_filtering && isCreditCardCoupon(coupon.coupon_title || "")) {
                              return false;
                            }
                            return true; // Show all coupons
                          case "精選地區":
                            // Only exclude credit card coupons if creditcard_filtering is enabled
                            if (merchant.creditcard_filtering && isCreditCardCoupon(coupon.coupon_title || "")) {
                              return false;
                            }
                            if (!selectedRegion) return true; // If no region selected, show all
                            return matchesRegion(coupon.coupon_title || "", selectedRegion);
                          case "信用卡優惠":
                            // When "信用卡優惠" filter is active, don't show coupons in active section
                            // They will be shown in the separate credit card section below
                            return false;
                          default:
                            return true;
                        }
                      }
                    })
                    .map((coupon, index) => {
                      const transformedCoupon = transformCoupon(coupon);
                      if (!transformedCoupon) {
                        console.error('Skipping invalid coupon:', coupon);
                        return null;
                      }
                      // Hide coupons after the 10th if showAllActiveCoupons is false
                      const shouldHide = !showAllActiveCoupons && index >= 10;
                      return (
                        <DealyCouponCard 
                          key={coupon.id}
                          id={`coupon-${coupon.id}`}
                          className={shouldHide ? 'hidden' : ''}
                          coupon={transformedCoupon} 
                          onClick={() => handleCouponClick(coupon)}
                          isScrolledTo={scrolledToCouponId === coupon.id}
                          merchantSlug={merchant.slug}
                        />
                      );
                    }).filter(Boolean)}
                  
                  {/* Show More Button - Only show if there are more than 10 filtered coupons */}
                  {uniqueCoupons.filter((coupon) => {
                    if (useSimpleFilters) {
                      // When useSimpleFilters is true, creditcard_filtering is false
                      // So credit card coupons should be counted normally
                      switch (activeFilter) {
                        case "全部":
                          return true;
                        case "折扣代碼":
                          return coupon.coupon_type === "promo_code";
                        case "優惠券":
                          return coupon.coupon_type !== "promo_code";
                        case "相關店鋪":
                          return false;
                        default:
                          return true;
                      }
                    } else {
                      switch (activeFilter) {
                        case "全部":
                          // Only exclude credit card coupons if creditcard_filtering is enabled
                          if (merchant.creditcard_filtering && isCreditCardCoupon(coupon.coupon_title || "")) {
                            return false;
                          }
                          return true;
                        case "精選地區":
                          // Only exclude credit card coupons if creditcard_filtering is enabled
                          if (merchant.creditcard_filtering && isCreditCardCoupon(coupon.coupon_title || "")) {
                            return false;
                          }
                          if (!selectedRegion) return true;
                          return matchesRegion(coupon.coupon_title || "", selectedRegion);
                        case "信用卡優惠":
                          // When "信用卡優惠" filter is active, don't count coupons for "Show More" button
                          return false;
                        default:
                          return true;
                      }
                    }
                  }).length > 10 && !showAllActiveCoupons && activeFilter !== "相關店鋪" && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={() => setShowAllActiveCoupons(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                      >
                        顯示更多
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {/* Credit Card Coupons Section - Only show when creditcard_filtering is true */}
              {merchant.creditcard_filtering && (
                <section
                  id="creditcard-active-coupons"
                  aria-labelledby={`${merchant.slug}-creditcard-heading`}
                  className="mb-10"
                >
                  <h2
                    id={`${merchant.slug}-creditcard-heading`}
                    className="text-lg md:text-xl font-bold mb-4"
                  >
                    {merchant.name}信用卡優惠一覽
                  </h2>
                  <div className="space-y-5">
                    {uniqueCoupons
                      .filter((coupon) => isCreditCardCoupon(coupon.coupon_title || ""))
                      .map((coupon, index) => {
                        const transformedCoupon = transformCoupon(coupon);
                        if (!transformedCoupon) {
                          console.error('Skipping invalid credit card coupon:', coupon);
                          return null;
                        }
                        return (
                          <DealyCouponCard 
                            key={coupon.id}
                            id={`credit-card-coupon-${coupon.id}`}
                            coupon={transformedCoupon} 
                            onClick={() => handleCouponClick(coupon)}
                            isScrolledTo={scrolledToCouponId === coupon.id}
                            merchantSlug={merchant.slug}
                          />
                        );
                      }).filter(Boolean)}
                  </div>
                </section>
              )}

              {/* Merchant Rating Section */}
              <div className="mb-10 py-4 border-t border-b border-gray-200">
                <MerchantRating merchantName={merchant.name} />
              </div>

              {/* Expired Coupons Section */}
              {expiredCoupons.length > 0 && (
                <section
                  id="expired-coupons"
                  aria-labelledby={`${merchant.slug}-expired-heading`}
                  className="mb-10"
                >
                  <h2
                    id={`${merchant.slug}-expired-heading`}
                    className="text-lg md:text-xl font-bold mb-4"
                  >
                    已過期但仍可嘗試
                  </h2>
                  <div className="relative">
                    <Card className="shadow-md relative">
                      <CardContent className="space-y-4">
                        {uniqueExpiredCoupons.map((coupon, index) => {
                          const transformedCoupon = transformCoupon(coupon);
                          if (!transformedCoupon) {
                            console.error('Skipping invalid expired coupon:', coupon);
                            return null;
                          }
                          // Hide coupons after the 5th if showAllExpiredCoupons is false
                          const shouldHide = !showAllExpiredCoupons && index >= 5;
                          const showDetails = expiredCouponDetails[coupon.id] || false;
                          return (
                            <article 
                              key={coupon.id} 
                              id={`coupon-${coupon.id}`} 
                              className={`border border-gray-200 rounded-lg p-4 ${shouldHide ? 'hidden' : ''}`}
                            >
                              <div className="flex items-start gap-4">
                                  <div className="text-center min-w-[80px]">
                                  <div className="w-12 h-12 mb-2 mx-auto flex items-center justify-center relative">
                                    <img
                                      src={transformedCoupon.merchant?.logo || merchant.logo}
                                      alt={transformedCoupon.merchant?.name || merchant.name}
                                      width={48}
                                      height={48}
                                      loading="lazy"
                                      decoding="async"
                                      className="object-contain max-w-full max-h-full"
                                    />
                                  </div>
                                  <div className="text-lg font-bold text-purple-600">{transformedCoupon.discount}</div>
                                  <div className="text-sm text-gray-500">優惠</div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">折扣碼/優惠</div>
                                  <h3 className="text-sm font-medium text-blue-600 mb-2">{transformedCoupon.title}</h3>
                                   <Button className="bg-purple-400 hover:bg-purple-500 text-white text-sm px-6 py-2 mb-2" onClick={() => handleCouponClick(coupon)}>
                                     {getButtonText(coupon.coupon_type)} ➤
                                   </Button>
                                   
                                   {/* Collapsible Description Section */}
                                   <div className="mt-2">
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       onClick={() => setExpiredCouponDetails(prev => ({ ...prev, [coupon.id]: !showDetails }))}
                                       className="text-xs text-blue-600 p-0 h-auto hover:underline"
                                     >
                                       {showDetails ? '隱藏優惠詳情' : '顯示優惠詳情'}
                                       {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                                     </Button>
                                     
                                     {showDetails && (
                                       <div className="mt-3 space-y-3">
                                         {transformedCoupon.steps && (
                                           <div className="text-xs text-gray-600">
                                             <div className="text-gray-700 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: transformedCoupon.steps }}></div>
                                           </div>
                                         )}
                                         {transformedCoupon.terms && (
                                           <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                             <div className="text-xs">
                                               <div className="font-medium text-yellow-800 mb-1">💡 溫馨提示：</div>
                                               <div className="text-yellow-700">{transformedCoupon.terms}</div>
                                             </div>
                                           </div>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                </div>
                              </div>
                            </article>
                          );
                        }).filter(Boolean)}
                      
                      {/* Show More Button - Only show if there are more than 5 expired coupons */}
                      {uniqueExpiredCoupons.length > 5 && !showAllExpiredCoupons && (
                        <div className="flex justify-center mt-4">
                          <Button
                            onClick={() => setShowAllExpiredCoupons(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                          >
                            顯示更多
                          </Button>
                        </div>
                      )}
                      </CardContent>
                      {/* Grey overlay on top to make all colors pale */}
                      <div className="absolute inset-0 bg-white/35 rounded-lg pointer-events-none z-10"></div>
                    </Card>
                  </div>
                </section>
              )}

      </div>

      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
    </>
  );
};

export default MerchantCouponsClient;
