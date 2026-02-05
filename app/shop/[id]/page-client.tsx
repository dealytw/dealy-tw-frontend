"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealyCouponCard from "@/components/DealyCouponCard";
import MerchantSidebar from "@/components/MerchantSidebar";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronRight, HelpCircle, Clock, User, Calendar, ArrowUp, Heart, ChevronDown, ChevronUp, Facebook, Share2 } from "lucide-react";
import { ShareDialog } from "@/components/ShareDialog";
import { getMerchantLogo } from "@/lib/data";
import { TransformedShop } from "@/types/cms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CouponCard from "@/components/CouponCard";
import RelatedMerchantCouponCard from "@/components/RelatedMerchantCouponCard";
import MerchantRating from "@/components/MerchantRating";
import ContactFormClient from "./ContactFormClient";
import { toast as sonnerToast } from "sonner";

/**
 * Convert Strapi blocks to HTML
 */
function blocksToHTML(blocks: any): string {
  if (!blocks) return '';
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
      return `<p style="margin: 0; margin-bottom: 0.5em;">${content}</p>`;
    }
    
    if (block.type === 'heading') {
      const level = block.level || 2;
      const content = processChildren(block.children || []);
      // H3 should be styled as a small title within the section
      if (level === 3) {
        return `<h3 style="font-size: 1rem; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; color: #374151;">${content}</h3>`;
      }
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
    
    // Handle image blocks
    if (block.type === 'image' && block.image) {
      let imageData = block.image;
      if (imageData?.data) {
        imageData = imageData.data;
      }
      
      const imageUrl = imageData?.attributes?.url || imageData?.url || '';
      const altText = imageData?.attributes?.alternativeText || imageData?.alternativeText || block.caption || '';
      
      if (imageUrl) {
        const escapedAlt = altText.replace(/"/g, '&quot;');
        
        if (block.caption) {
          const caption = processChildren(block.caption || []);
          return `<figure style="margin: 1em 0;"><img src="${imageUrl}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 0.5rem;" /><figcaption style="margin-top: 0.5em; font-size: 0.875em; color: #666; text-align: center;">${caption}</figcaption></figure>`;
        }
        return `<img src="${imageUrl}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1em 0;" />`;
      }
    }
    
    return '';
  }).join('\n');
}

/**
 * Clean question text by removing leading "?" or ":?"
 * Keeps emoji in the text
 */
function cleanQuestionText(text: string): string {
  if (!text) return '';
  // Remove leading "?" or ":?" but keep everything else including emoji
  return text.replace(/^[:\?]+\s*/, '').trim();
}

// Helper function to convert a block to HTML, preserving list structure
function blockToHTML(block: any): string {
  if (!block) return '';
  
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
        return `<a href="${child.url || '#'}">${linkText}</a>`;
      }
      if (child.children) {
        return processChildren(child.children);
      }
      return '';
    }).join('');
  };
  
  // Handle different block types
  if (block.type === 'paragraph') {
    const content = processChildren(block.children || []);
    return `<p>${content || '<br>'}</p>`;
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
}

// Helper function to parse FAQ rich text into question-answer pairs
function parseFAQs(richText: any): Array<{question: string, answer: string}> {
  if (!richText || !Array.isArray(richText)) return [];
  
  const faqs: Array<{question: string, answer: string}> = [];
  let currentQuestion = "";
  let currentAnswer = "";
  
  for (const item of richText) {
    // Check for H3 headings only
    if (item.type === "heading" && item.level === 3) {
      // If we have a previous question-answer pair, save it
      if (currentQuestion && currentAnswer) {
        faqs.push({
          question: currentQuestion,
          answer: currentAnswer.trim()
        });
      }
      // Start new question - extract text and clean it (remove leading ?)
      const rawQuestion = item.children?.map((child: any) => child.text || "").join("") || "";
      currentQuestion = cleanQuestionText(rawQuestion);
      currentAnswer = "";
    } else if (currentQuestion) {
      // Convert block to HTML to preserve list structure
      const html = blockToHTML(item);
      if (html) {
        currentAnswer += html;
      }
    }
  }
  
  // Don't forget the last FAQ
  if (currentQuestion && currentAnswer) {
    faqs.push({
      question: currentQuestion,
      answer: currentAnswer.trim()
    });
  }
  
  return faqs;
}

// Helper function to parse how-to rich text into structured content
function parseHowTo(richText: any): Array<{title: string, content: string}> {
  if (!richText || !Array.isArray(richText)) return [];
  
  const howToSections: Array<{title: string, content: string}> = [];
  let currentTitle = "";
  let currentContent = "";
  
  for (const item of richText) {
    if (item.type === "paragraph") {
      const paragraphText = item.children?.map((child: any) => {
        return child.text || "";
      }).join("") || "";
      
      // Check if this paragraph contains bold text (step title)
      const hasBoldText = item.children?.some((child: any) => child.bold);
      
      if (hasBoldText) {
        // If we have a previous section, save it
        if (currentTitle && currentContent) {
          howToSections.push({
            title: currentTitle,
            content: currentContent.trim()
          });
        }
        // Start new section with bold text as title (plain text, no HTML tags)
        currentTitle = paragraphText;
        currentContent = "";
      } else if (currentTitle) {
        // Add to current content
        if (currentContent) {
          currentContent += " " + paragraphText;
        } else {
          currentContent = paragraphText;
        }
      }
    } else if (item.type === "list" && currentTitle) {
      // Handle bullet points
      const listItems = item.children?.map((child: any) => {
        if (child.children && Array.isArray(child.children)) {
          return child.children.map((grandChild: any) => {
            return grandChild.text || "";
          }).join("");
        }
        return child.text || "";
      }).join("\n• ") || "";
      
      if (currentContent) {
        currentContent += "\n• " + listItems;
      } else {
        currentContent = "• " + listItems;
      }
    }
  }
  
  // Don't forget the last section
  if (currentTitle && currentContent) {
    howToSections.push({
      title: currentTitle,
      content: currentContent.trim()
    });
  }
  
  return howToSections;
}

interface MerchantProps {
  merchant: TransformedShop;
  coupons: any[];
  expiredCoupons: any[];
  relatedMerchants: any[];
  hotstoreMerchants?: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  }>;
  market: string;
  specialOffers?: Array<{
    id: number;
    title: string;
    slug: string;
    type?: string;
  }>;
  relatedBlogs?: Array<{
    id: number;
    title: string;
    slug: string;
    type?: string;
  }>;
  alternateUrl?: string | null;
  smallBlogSection?: any;
  smallBlogSectionTitle?: string | null;
  shareUrl?: string;
}

const Merchant = ({ merchant, coupons, expiredCoupons, relatedMerchants, alternateUrl, hotstoreMerchants = [], market, specialOffers = [], relatedBlogs = [], smallBlogSection, smallBlogSectionTitle, shareUrl = '' }: MerchantProps) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = merchant.h1Title || merchant.page_title_h1 || merchant.name;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        break;
      case 'share-dialog':
        setIsShareDialogOpen(true);
        break;
      default:
        navigator.clipboard.writeText(url);
        break;
    }
  };

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

  // Use server-computed display (coupon.display) for hydration consistency
  const getDisplay = (coupon: any) => coupon?.display ?? null;

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
            const display = getDisplay(coupon);
            if (display) {
              setSelectedCoupon(display);
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
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1 px-2">
        <div className="max-w-full mx-auto px-2">
          <p className="text-[8px] text-gray-600 text-center leading-tight">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
          </p>
        </div>
      </div>
      
      <main id="main" className="container mx-auto md:px-4 px-2 py-4" itemScope itemType="https://schema.org/CreativeWork">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-4">
            {/* Page Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center lg:hidden relative">
                {merchant.logo && (
                  <img
                    src={merchant.logo}
                    alt={merchant.name}
                    width={48}
                    height={48}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="object-contain max-w-full max-h-full"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col mb-2">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900 mb-2">
                    {merchant.h1Title || merchant.page_title_h1 || '錯誤：無法載入標題'}
                  </h1>
                  <div className="flex items-center justify-between md:justify-start">
                    {merchant.lastUpdatedDate && (
                      <span className="text-xs text-gray-600 sm:mb-1" suppressHydrationWarning>
                        最近更新：<time dateTime={merchant.lastUpdatedDateISO || undefined}>{merchant.lastUpdatedDate}</time>（每日更新）{" "}
                        <Link href="/about" className="text-gray-600 hover:text-gray-900 underline underline-offset-2">
                          by Dealy TW Team
                        </Link>
                      </span>
                    )}
                    <div className="flex items-center gap-2 md:hidden">
                      <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare('facebook')}>
                        <Facebook className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare('whatsapp')}>
                        <svg
                          className="w-3.5 h-3.5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.09c0 1.744.413 3.379 1.144 4.826L.06 24l9.305-2.533a11.714 11.714 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.89a11.898 11.898 0 00-3.48-8.413Z" />
                        </svg>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full h-7 w-7 p-0" onClick={() => handleShare('share-dialog')}>
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed mb-6">
              {merchant.description || ""}
            </p>

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
                                suppressHydrationWarning
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
                                suppressHydrationWarning
                              >
                                {c.coupon_title || merchant.name}
                              </a>
                            </td>
                            <td className="py-1 align-top whitespace-nowrap text-gray-700">
                              {c.expires_at_formatted ?? "長期有效"}
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
                      const display = getDisplay(coupon);
                      if (!display) {
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
                          coupon={display} 
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
                        const display = getDisplay(coupon);
                        if (!display) {
                          console.error('Skipping invalid credit card coupon:', coupon);
                          return null;
                        }
                        return (
                          <DealyCouponCard 
                            key={coupon.id}
                            id={`credit-card-coupon-${coupon.id}`}
                            coupon={display} 
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
                <MerchantRating merchantName={merchant.name} ratingCount={merchant.ratingCount ?? 0} />
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
                          const display = getDisplay(coupon);
                          if (!display) {
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
                                      src={display.merchant?.logo || merchant.logo}
                                      alt={display.merchant?.name || merchant.name}
                                      width={48}
                                      height={48}
                                      loading="lazy"
                                      decoding="async"
                                      className="object-contain max-w-full max-h-full"
                                    />
                                  </div>
                                  <div className="text-lg font-bold text-purple-600">{display.discount}</div>
                                  <div className="text-sm text-gray-500">優惠</div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">折扣碼/優惠</div>
                                  <h3 className="text-sm font-medium text-blue-600 mb-2">{display.title}</h3>
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
                                         {display.steps && (
                                           <div className="text-xs text-gray-600">
                                             <div className="text-gray-700 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: display.steps }}></div>
                                           </div>
                                         )}
                                         {display.terms && (
                                           <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                             <div className="text-xs">
                                               <div className="font-medium text-yellow-800 mb-1">💡 溫馨提示：</div>
                                               <div className="text-yellow-700">{display.terms}</div>
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

              {/* Related Merchants Section */}
              <section
                id="related-store-coupons"
                aria-labelledby={`${merchant.slug}-related-heading`}
                className="mb-10"
              >
                <h2
                  id={`${merchant.slug}-related-heading`}
                  className="text-lg md:text-xl font-bold mb-4"
                >
                  同類商戶折扣優惠
                </h2>
                <Card id="related-merchants-section" className="shadow-md">
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedMerchants && relatedMerchants.length > 0 ? (
                      relatedMerchants.map((relatedMerchant) => (
                        <RelatedMerchantCouponCard 
                          key={relatedMerchant.id} 
                          relatedMerchant={relatedMerchant}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center text-gray-500 py-8">
                        暫無同類商戶折扣優惠
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* FAQ Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    常見問題
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {merchant.faqs && Array.isArray(merchant.faqs) && merchant.faqs.length > 0 ? (
                    merchant.faqs.map((faq: any, index: number) => {
                      // Handle both parsed format {question, answer} and raw blocks format
                      let question = faq?.question || faq?.q || '';
                      let answer = faq?.answer || faq?.a || '';
                      
                      // If it's still in blocks format, parse it
                      if (!question && !answer && faq.type) {
                        const parsed = parseFAQs([faq]);
                        if (parsed.length > 0) {
                          const parsedFaq = parsed[0];
                          return (
                            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                              <h3 className="font-medium text-pink-600 mb-2">
                                {parsedFaq.question}
                              </h3>
                              <div 
                                className="text-sm text-gray-600 ml-6 faq-answer-content" 
                                dangerouslySetInnerHTML={{ __html: parsedFaq.answer }}
                              />
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      // Use parsed format directly
                      if (question && answer) {
                        // Clean question if it still contains leading "?"
                        question = cleanQuestionText(question);
                        
                        return (
                          <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                            <h3 className="font-medium text-pink-600 mb-2">
                              {question}
                            </h3>
                            <div 
                              className="text-sm text-gray-600 ml-6 faq-answer-content" 
                              dangerouslySetInnerHTML={{ __html: answer }}
                            />
                          </div>
                        );
                      }
                      
                      return null;
                    }).filter(Boolean)
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      暫無常見問題
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Shopping Categories and Guides */}
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-800">相關購物分類及攻略</h2>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Combine related_blogs (first) and special_offers (second)
                    const allItems = [
                      ...(relatedBlogs || []).map(blog => ({ ...blog, type: 'blog' })),
                      ...(specialOffers || []).map(offer => ({ ...offer, type: 'special_offer' }))
                    ];
                    
                    if (allItems.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2">
                          {allItems.map((item) => (
                            <Link
                              key={`${item.type}-${item.id}`}
                              href={item.type === 'blog' ? `/blog/${item.slug}` : `/special-offers/${item.slug}`}
                            >
                              <Badge variant="outline" className="cursor-pointer px-3 py-1 text-sm border-gray-300 hover:bg-gray-50 transition-colors">
                                {item.title}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          <p>暫無相關購物攻略</p>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>

              {/* How to Use Coupons Guide */}
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    如何於{merchant.name}使用優惠碼
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* How To Images */}
                  {merchant.how_to_image && Array.isArray(merchant.how_to_image) && merchant.how_to_image.length > 0 && (
                    <div className="mb-4">
                      {merchant.how_to_image.map((imageUrl: string, imgIndex: number) => (
                        <img
                          key={imgIndex}
                          src={imageUrl}
                          alt={`如何於${merchant.name}使用優惠碼 - 步驟 ${imgIndex + 1}`}
                          className="w-full max-w-[427px] h-auto rounded-lg border border-gray-200"
                          loading="lazy"
                          decoding="async"
                        />
                      ))}
                    </div>
                  )}
                  
                  {merchant.how_to && Array.isArray(merchant.how_to) && merchant.how_to.length > 0 ? (
                    merchant.how_to.map((item: any, index: number) => {
                      // Handle both parsed format {step, descriptions} and raw blocks format
                      const step = item?.step || item?.title || '';
                      const descriptions = Array.isArray(item?.descriptions) ? item.descriptions : 
                                          (item?.content ? [item.content] : []);
                      
                      // If it's still in blocks format, parse it
                      if (!step && !descriptions.length && item.type) {
                        const parsed = parseHowTo([item]);
                        if (parsed.length > 0) {
                          const parsedItem = parsed[0];
                          return (
                            <div key={index} className="space-y-3">
                              <h4 className="font-semibold text-gray-800 text-lg">
                                {index + 1}. {parsedItem.title}
                              </h4>
                              <div className="text-sm text-gray-600 space-y-2 whitespace-pre-line">
                                {parsedItem.content}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      // Use parsed format directly
                      if (step && descriptions.length > 0) {
                        return (
                          <div key={index} className="space-y-3">
                            <h4 className="font-semibold text-gray-800 text-lg">
                              {index + 1}. {step}
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                              {descriptions.map((desc: string, descIndex: number) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      
                      return null;
                    }).filter(Boolean)
                  ) : (
                    <div className="space-y-3">
                      <p className="font-medium">1) 先在本頁按「顯示優惠碼」/「獲取折扣」</p>
                      <p className="font-medium">2) 登入 {merchant.name} 帳戶</p>
                      <p className="font-medium">3) 選擇產品加入購物車</p>
                      <p className="font-medium">4) 結帳頁輸入或套用優惠</p>
                      <p className="font-medium">5) 確認折扣已生效再付款。</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Small Blog Section */}
              {smallBlogSection && 
               (typeof smallBlogSection === 'string' ? smallBlogSection.trim() !== '' : 
                (Array.isArray(smallBlogSection) ? smallBlogSection.length > 0 : true)) && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">
                      {smallBlogSectionTitle || `精選${merchant.name}優惠懶人包`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ 
                        __html: typeof smallBlogSection === 'string' 
                          ? smallBlogSection 
                          : blocksToHTML(smallBlogSection) 
                      }} 
                    />
                  </CardContent>
                </Card>
              )}

              {/* Contact Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-800">聯絡我們</h2>
                </CardHeader>
                <CardContent>
                  <ContactFormClient merchantName={merchant.name} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <MerchantSidebar merchant={merchant} coupons={uniqueCoupons} expiredCoupons={uniqueExpiredCoupons} hotstoreMerchants={hotstoreMerchants} />
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="mt-8 pt-6 border-t border-gray-200" aria-label="Breadcrumb">
          <div className="flex items-center text-sm text-blue-600 mb-4">
            <Link href="/" className="cursor-pointer hover:underline">
              Dealy.TW 最新優惠平台
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/shop" className="cursor-pointer hover:underline">所有商店</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-600">{merchant.name}</span>
          </div>
        </nav>
      </main>

      {/* Coupon Modal */}
      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
      
      {/* Share Dialog */}
      <ShareDialog 
        open={isShareDialogOpen} 
        onOpenChange={setIsShareDialogOpen} 
        url={shareUrl} 
        title={merchant.h1Title || merchant.page_title_h1 || merchant.name} 
      />
      
      {/* Footer */}
      <Footer alternateUrl={alternateUrl} />
    </div>
  );
};

export default Merchant;
