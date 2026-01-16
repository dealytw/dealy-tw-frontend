"use client";
import { useState } from "react";
import CouponModal from "@/components/CouponModal";
import DealySidebar from "@/components/DealySidebar";
import DealyCouponCard from "@/components/DealyCouponCard";

// Types matching homepage-code-usage.json
type PopularMerchant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  topCouponTitle?: string;
};

type CategoryBadge = {
  id: number;
  name: string;
  slug: string;
  iconUrl: string;
};

type CouponRailItem = {
  id: string;
  merchantId: string;
  merchantSlug?: string;
  merchantName?: string;
  logo: string;
  discount: string;
  type: string;
  couponType: "coupon" | "promo_code" | "auto_discount";
  title: string;
  timeLeft?: string;
  usageCount: number;
  description: string;
  terms?: string;
  code?: string;
  affiliateLink: string;
  expiresAt?: string; // Raw expiry date for client-side calculation
};

type HomePageData = {
  seo: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    bgUrl: string;
    searchPlaceholder: string;
  };
  popularMerchants: {
    heading: string;
    items: PopularMerchant[];
  };
  categoryBlock: {
    heading: string;
    categories: CategoryBadge[];
    disclaimer: string;
  };
  couponRail: {
    heading: string;
    items: CouponRailItem[];
  };
  sidebarCategories?: {
    heading: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      iconUrl: string;
    }>;
  };
};

interface HomeCouponRailClientProps {
  initialData: HomePageData;
}

const HomeCouponRailClient = ({ initialData }: HomeCouponRailClientProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to extract text from rich text (for plain text display)
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

  // Helper function to render rich text with formatting preserved (same as merchant page)
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

  // Transform CMS coupons to DealyCouponCard format (same as merchant page)
  const transformCoupon = (coupon: any) => {
    // Add null safety checks
    if (!coupon) {
      console.error('transformCoupon: coupon is null or undefined');
      return null;
    }

    // Handle different data structures - homepage vs merchant page
    let merchantData;
    if (coupon.merchant) {
      // Merchant page structure
      merchantData = coupon.merchant;
    } else if (coupon.merchantId) {
      // Homepage structure - use merchantName from coupon data (from getTopCouponForMerchant)
      merchantData = {
        merchant_name: coupon.merchantName || '',
        name: coupon.merchantName || '',
        logo: coupon.logo || '',
      };
    } else {
      console.warn('transformCoupon: no merchant data found, using fallback', coupon.id);
      merchantData = {
        merchant_name: '',
        name: '',
        logo: '',
      };
    }

    // Handle null/undefined values safely
    const value = coupon.discount || '';
    // Enhanced regex to handle currencies: TWD, HKD, USD, etc. and symbols: $, ¥, €, etc.
    const currencyPattern = /(\d+)\s*(?:TWD|HKD|USD|EUR|JPY|CNY|SGD|MYR|THB|PHP|IDR|VND|KRW|INR|AUD|CAD|GBP|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RUB|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|ZAR|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|NGN|KES|UGX|TZS|ZMW|BWP|MWK|MZN|AOA|XOF|XAF|XPF|MUR|SCR|KMF|DJF|ERN|ETB|SOS|SLL|GMD|GNF|LRD|CDF|RWF|BIF|CVE|STN|SZL|LSL|NAD|BND|FJD|PGK|SBD|TOP|VUV|WST|TVD|KID|NPR|BTN|MVR|AFN|PKR|LKR|BDT|MMK|LAK|KHR|MOP)?\s*\$?\s*(%|折|off|減|扣|折|優惠)/i;
    const discountValue = value ? value.replace(currencyPattern, '$1') : '0';
    
    return {
      id: coupon.id,
      code: coupon.code || '',
      title: coupon.title || 'Untitled Coupon',
      description: extractTextFromRichText(coupon.description), // Plain text for short description
      discount: value,
      discountValue: discountValue,
      expiry: coupon.expiresAt || "長期有效",
      usageCount: coupon.usageCount || 0,
      steps: renderRichText(coupon.description), // Rich text HTML for detailed description (same as merchant page)
      terms: renderRichText(coupon.terms), // Rich text HTML for editor tips (same as merchant page)
      affiliateLink: coupon.affiliateLink || '#',
      coupon_type: coupon.couponType,
      merchant: {
        name: merchantData.merchant_name || merchantData.name || '',
        logo: merchantData.logo || '',
      }
    };
  };

  const handleCouponClick = (coupon: CouponRailItem) => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id.startsWith('coupon-') 
          ? coupon.id.replace('coupon-', '') 
          : coupon.id,
        couponTitle: coupon.title,
        couponCode: coupon.code,
        merchantName: coupon.merchantName,
        merchantSlug: coupon.merchantSlug,
        affiliateLink: coupon.affiliateLink || '#',
        couponType: (coupon.couponType || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });
      
      // Parallel actions (no delays, no setTimeout)
      if (coupon.merchantSlug) {
        // Action 1: Open merchant page (new tab) with hash so merchant page auto-opens modal & scrolls
        const couponId = coupon.id.startsWith('coupon-') 
          ? coupon.id.replace('coupon-', '') 
          : coupon.id;
        const merchantUrl = `/shop/${coupon.merchantSlug}#coupon-${couponId}`;
        window.open(merchantUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback: if no merchant slug, open modal for backward compatibility
        const transformedCoupon = transformCoupon(coupon);
        if (!transformedCoupon) {
          console.error('Failed to transform coupon for modal:', coupon);
          return;
        }
        
        setSelectedCoupon(transformedCoupon);
        setIsModalOpen(true);
      }
      
      // Action 2: Redirect current tab to affiliate link (instant, no delay)
      if (coupon.affiliateLink && coupon.affiliateLink !== '#') {
        window.location.href = coupon.affiliateLink;
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Coupon Rail */}
      {initialData.couponRail?.items && initialData.couponRail.items.length > 0 && (
        <section id="popular-coupons" className="py-12 px-4 md:px-4 px-2" aria-labelledby="popular-coupons-heading">
          <div className="container mx-auto md:px-4 px-0">
            {/* CMS: coupon.heading */}
            <h2 id="popular-coupons-heading" className="text-2xl font-bold text-center mb-12 text-gray-800">
              {initialData.couponRail?.heading || "本日最新最受歡迎折扣碼/優惠券/Promo Code"}
            </h2>
            
            <div className="flex gap-8">
              {/* Main Content */}
              <div className="flex-1 space-y-8 md:space-y-8 space-y-4">
                {initialData.couponRail.items.map((coupon) => {
                  const transformedCoupon = transformCoupon(coupon);
                  if (!transformedCoupon) {
                    console.error('Skipping invalid coupon:', coupon);
                    return null;
                  }
                  // Debug: Log merchantSlug for homepage coupons
                  if (!coupon.merchantSlug) {
                    console.warn('Homepage coupon missing merchantSlug:', {
                      couponId: coupon.id,
                      merchantId: coupon.merchantId,
                      title: coupon.title
                    });
                  }
                  return (
                    <article key={coupon.id} id={`coupon-${coupon.id}`}>
                      <DealyCouponCard 
                        coupon={transformedCoupon} 
                        onClick={() => handleCouponClick(coupon)}
                        isScrolledTo={false}
                        merchantSlug={coupon.merchantSlug}
                        showViewMoreButton={true}
                      />
                    </article>
                  );
                }).filter(Boolean)}
              </div>
              {/* Sidebar */}
              <div className="hidden lg:block">
                <DealySidebar 
                  popularMerchants={initialData.popularMerchants}
                  sidebarCategories={initialData.sidebarCategories || { heading: "熱門分類", categories: [] }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coupon Modal */}
      <CouponModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        coupon={selectedCoupon}
      />

    </>
  );
};

export default HomeCouponRailClient;
