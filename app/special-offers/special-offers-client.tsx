"use client";
import { useState } from "react";
import Link from "next/link";
import DealyCouponCard from "@/components/DealyCouponCard";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SpecialOffer {
  id: number;
  title: string;
  slug: string;
  intro?: string;
}

interface FeaturedMerchant {
  id: number;
  name: string;
  slug: string;
  logo: string;
  link: string;
}

interface FlashDeal {
  id: string;
  coupon_title: string;
  description: string;
  value: string;
  code?: string;
  coupon_type: string;
  expires_at: string;
  user_count: number;
  display_count?: number;
  affiliate_link: string;
  editor_tips?: string;
  merchant: {
    id: number;
    merchant_name: string;
    slug: string;
    logo: string;
  };
}

interface SpecialOffersClientProps {
  flashDeals: FlashDeal[];
}

// Helper function to extract text from Strapi rich text
function extractTextFromRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((node: any) => {
        if (node.type === "text" && node.text) return node.text;
        if (node.children) return extractTextFromRichText(node.children);
        return "";
      })
      .join(" ");
  }
  return "";
}

// Helper function to convert Strapi rich text blocks to HTML (same as blog view)
function blocksToHTML(blocks: any): string {
  if (!blocks) return '';
  if (typeof blocks === 'string') return blocks; // If it's already a string, return it
  if (!Array.isArray(blocks)) return '';
  
  // Process children to extract text with formatting
  const processChildren = (children: any[]): string => {
    if (!children || !Array.isArray(children)) return '';
    
    return children.map((child: any) => {
      if (child.type === 'text' || child.text !== undefined) {
        let text = child.text || '';
        // Apply formatting
        if (child.bold) text = `<strong>${text}</strong>`;
        if (child.italic) text = `<em>${text}</em>`;
        if (child.code) text = `<code>${text}</code>`;
        if (child.strikethrough) text = `<s>${text}</s>`;
        if (child.underline) text = `<u>${text}</u>`;
        return text;
      }
      if (child.type === 'link') {
        const linkText = processChildren(child.children || []);
        return `<a href="${child.url || '#'}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      if (child.children) {
        return processChildren(child.children);
      }
      return '';
    }).join('');
  };
  
  return blocks.map((block: any) => {
    if (block.type === 'paragraph') {
      const content = processChildren(block.children || []);
      // If paragraph is empty or just whitespace, treat as line break
      if (!content || content.trim() === '') {
        return '<br>';
      }
      // Use p with minimal margin to preserve line breaks without extra spacing
      return `<p style="margin: 0; margin-bottom: 0.5em;">${content}</p>`;
    }
    
    if (block.type === 'heading') {
      const level = block.level || 2;
      const content = processChildren(block.children || []);
      return `<h${level}>${content}</h${level}>`;
    }
    
    if (block.type === 'list') {
      const isOrdered = block.format === 'ordered';
      const items = (block.children || []).map((item: any) => {
        const content = processChildren(item.children || []);
        return `<li>${content}</li>`;
      }).join('');
      return isOrdered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
    }
    
    return '';
  }).join('\n');
}

// Helper function to render rich text as HTML
function renderRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  // Use blocksToHTML for rich text arrays
  return blocksToHTML(richText);
}

const SpecialOffersClient = ({ flashDeals }: SpecialOffersClientProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");

  const filters = ["全部", "最新優惠碼", "最新折扣"];

  // Transform CMS coupon to DealyCouponCard format
  const transformCoupon = (coupon: FlashDeal) => {
    if (!coupon) return null;

    const value = coupon.value || '';
    const currencyPattern = /([$¥€£]|\w+)\s*(\d+)/i;
    const discountValue = value ? value.replace(currencyPattern, '$1') : '0';
    
    return {
      id: coupon.id,
      code: coupon.code || '',
      title: coupon.coupon_title || 'Untitled Coupon',
      description: extractTextFromRichText(coupon.description),
      discount: value,
      discountValue: discountValue,
      expiry: coupon.expires_at || "長期有效",
      usageCount: coupon.display_count || coupon.user_count || 0,
      steps: renderRichText(coupon.description),
      terms: extractTextFromRichText(coupon.editor_tips),
      affiliateLink: coupon.affiliate_link || '#',
      coupon_type: coupon.coupon_type,
      merchant: {
        name: coupon.merchant.merchant_name || '',
        logo: coupon.merchant.logo || '',
      }
    };
  };

  const handleCouponClick = (coupon: FlashDeal) => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id.toString(),
        couponTitle: coupon.coupon_title,
        couponCode: coupon.code,
        merchantName: coupon.merchant?.merchant_name || coupon.merchant?.name || '',
        merchantSlug: coupon.merchant?.slug,
        affiliateLink: coupon.affiliate_link || '#',
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });

      // Parallel actions (no delays, no setTimeout)
      const merchantSlug = coupon.merchant?.slug;
      if (merchantSlug) {
        // Action 1: Open merchant page (new tab) with hash so merchant page auto-opens modal & scrolls
        const merchantUrl = `/shop/${merchantSlug}#coupon-${coupon.id}`;
        window.open(merchantUrl, '_blank', 'noopener,noreferrer');
      }
      
      // Action 2: Redirect current tab to affiliate link (instant, no delay)
      if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
        window.location.href = coupon.affiliate_link;
      }
    }
  };

  return (
    <>
      <section aria-labelledby="flash-deals-heading">
        <div className="flex items-center justify-between mb-6">
          <h2 id="flash-deals-heading" className="text-2xl font-bold text-foreground">
            快閃優惠
          </h2>

          <Button
            variant="outline"
            className="text-sm flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            type="button"
          >
            <Plus className="w-4 h-4" />
            提交優惠券
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Flash Deals Grid */}
        <div className="space-y-0">
          {flashDeals.map((coupon) => {
            const transformedCoupon = transformCoupon(coupon);
            if (!transformedCoupon) return null;

            return (
              <div key={coupon.id} id={`coupon-${coupon.id}`}>
                <DealyCouponCard coupon={transformedCoupon} onClick={() => handleCouponClick(coupon)} merchantSlug={coupon.merchant?.slug} />
              </div>
            );
          })}
        </div>
      </section>

      <CouponModal open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)} coupon={selectedCoupon} />
    </>
  );
};

export default SpecialOffersClient;
