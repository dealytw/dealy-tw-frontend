"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { ChevronRight, HelpCircle, Clock, User, Calendar, ArrowUp, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { getMerchantLogo } from "@/lib/data";
import { TransformedShop } from "@/types/cms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CouponCard from "@/components/CouponCard";
import RelatedMerchantCouponCard from "@/components/RelatedMerchantCouponCard";
import { useToast } from "@/hooks/use-toast";

// Get Taiwan time (UTC+8)
function getTaiwanDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
}

// Contact Form Component
function ContactForm({ merchantName }: { merchantName: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
      merchantName: merchantName,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "提交成功！",
          description: "我們會盡快回覆您的訊息。",
        });
        // Reset form
        e.currentTarget.reset();
      } else {
        toast({
          title: "提交失敗",
          description: result.error || "請稍後再試。",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "提交失敗",
        description: "請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          ✍️ 你的名字 *
        </Label>
        <Input id="contact-name" name="name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          💗 你的電郵 *
        </Label>
        <Input id="contact-email" name="email" type="email" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          ✍️ 你的信息 （歡迎任何意見或問題） *
        </Label>
        <Textarea id="contact-message" name="message" rows={6} required className="mt-1" />
      </div>
      <Button 
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:opacity-50"
      >
        {isSubmitting ? '提交中...' : '📧提交'}
      </Button>
    </form>
  );
}

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

// Helper function to parse FAQ rich text into question-answer pairs
function parseFAQs(richText: any): Array<{question: string, answer: string}> {
  if (!richText || !Array.isArray(richText)) return [];
  
  const faqs: Array<{question: string, answer: string}> = [];
  let currentQuestion = "";
  let currentAnswer = "";
  
  for (const item of richText) {
    if (item.type === "heading" && item.level === 3) {
      // If we have a previous question-answer pair, save it
      if (currentQuestion && currentAnswer) {
        faqs.push({
          question: currentQuestion,
          answer: currentAnswer.trim()
        });
      }
      // Start new question
      currentQuestion = item.children?.map((child: any) => child.text || "").join("") || "";
      currentAnswer = "";
    } else if (item.type === "paragraph" && currentQuestion) {
      // Add to current answer
      const paragraphText = item.children?.map((child: any) => {
        if (child.bold) return `<strong>${child.text || ""}</strong>`;
        if (child.italic) return `<em>${child.text || ""}</em>`;
        return child.text || "";
      }).join("") || "";
      
      if (currentAnswer) {
        currentAnswer += " " + paragraphText;
      } else {
        currentAnswer = paragraphText;
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
  }>;
}

const Merchant = ({ merchant, coupons, expiredCoupons, relatedMerchants, hotstoreMerchants = [], market, specialOffers = [] }: MerchantProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [scrolledToCouponId, setScrolledToCouponId] = useState<string | null>(null);
  const [expiredCouponDetails, setExpiredCouponDetails] = useState<Record<string, boolean>>({});
  const [showAllActiveCoupons, setShowAllActiveCoupons] = useState(false);
  const [isRegionExpanded, setIsRegionExpanded] = useState(false);
  
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
        name: coupon.merchant.name || 'Unknown Merchant',
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
          const coupon = coupons.find(c => c.id === couponId) || expiredCoupons.find(c => c.id === couponId);
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
    }
    
    // Parallel actions (no delays, no setTimeout)
    // Action 1: Open merchant page (new tab) - using <a> tag (faster than window.open)
    const baseUrl = window.location.href.split('#')[0]; // Remove existing hash
    const merchantUrl = baseUrl + `#coupon-${coupon.id}`;
    const link = document.createElement('a');
    link.href = merchantUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Action 2: Redirect current tab to affiliate link (instant, no delay)
    if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
      window.location.href = coupon.affiliate_link;
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
      
      <main id="main" className="container mx-auto md:px-4 px-2 py-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-4">
            {/* Page Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center lg:hidden relative">
                {merchant.logo && (
                  <Image 
                    src={merchant.logo} 
                    alt={merchant.name} 
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mb-2">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900">
                    {merchant.h1Title || merchant.page_title_h1 || '錯誤：無法載入標題'}
                  </h1>
                  <p className="text-xs text-gray-600 sm:mb-1">
                    最近更新： {merchant.lastUpdatedDate || '錯誤：無法載入日期'} （每日更新）
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed mb-6">
              {merchant.description ? merchant.description : `${merchant.name}優惠碼限時登場！透過信用卡專屬折扣或指定 Promo Code，即享機票、酒店、高鐵優惠，助你即省更多。`}
            </p>
            
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
                
                <div className="space-y-0">
                  {coupons
                    .filter((coupon) => {
                      // Apply filtering based on activeFilter
                      if (useSimpleFilters) {
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
                            return true; // Show all coupons
                          case "精選地區":
                            if (!selectedRegion) return true; // If no region selected, show all
                            return matchesRegion(coupon.coupon_title || "", selectedRegion);
                          case "信用卡優惠":
                            // Wait for next implementation
                            return true;
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
                        <div 
                          key={coupon.id} 
                          id={`coupon-${coupon.id}`}
                          className={shouldHide ? 'hidden' : ''}
                        >
                          <DealyCouponCard 
                            coupon={transformedCoupon} 
                            onClick={() => handleCouponClick(coupon)}
                            isScrolledTo={scrolledToCouponId === coupon.id}
                            merchantSlug={merchant.slug}
                          />
                        </div>
                      );
                    }).filter(Boolean)}
                  
                  {/* Show More Button - Only show if there are more than 10 filtered coupons */}
                  {coupons.filter((coupon) => {
                    if (useSimpleFilters) {
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
                          return true;
                        case "精選地區":
                          if (!selectedRegion) return true;
                          return matchesRegion(coupon.coupon_title || "", selectedRegion);
                        case "信用卡優惠":
                          return true;
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
                  <div className="space-y-0">
                    {coupons
                      .filter((coupon) => isCreditCardCoupon(coupon.coupon_title || ""))
                      .map((coupon, index) => {
                        const transformedCoupon = transformCoupon(coupon);
                        if (!transformedCoupon) {
                          console.error('Skipping invalid credit card coupon:', coupon);
                          return null;
                        }
                        return (
                          <div 
                            key={coupon.id} 
                            id={`credit-card-coupon-${coupon.id}`}
                          >
                            <DealyCouponCard 
                              coupon={transformedCoupon} 
                              onClick={() => handleCouponClick(coupon)}
                              isScrolledTo={scrolledToCouponId === coupon.id}
                              merchantSlug={merchant.slug}
                            />
                          </div>
                        );
                      }).filter(Boolean)}
                  </div>
                </section>
              )}

              {/* Expired Coupons Section */}
              {expiredCoupons.length > 0 && (
                <section
                  id="expired-coupons"
                  aria-labelledby={`${merchant.slug}-expired-heading`}
                  className="mb-10"
                  data-nosnippet="true"
                >
                  <h2
                    id={`${merchant.slug}-expired-heading`}
                    className="text-lg md:text-xl font-bold mb-4"
                  >
                    已過期優惠碼（僅供參考）
                  </h2>
                  <div className="relative">
                    <Card className="shadow-md relative">
                      <CardContent className="space-y-4">
                        {expiredCoupons.map(coupon => {
                          const transformedCoupon = transformCoupon(coupon);
                          if (!transformedCoupon) {
                            console.error('Skipping invalid expired coupon:', coupon);
                            return null;
                          }
                          const showDetails = expiredCouponDetails[coupon.id] || false;
                          return (
                            <div key={coupon.id} id={`coupon-${coupon.id}`} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start gap-4">
                                <div className="text-center min-w-[80px]">
                                  <div className="w-12 h-12 mb-2 mx-auto flex items-center justify-center relative">
                                    <Image 
                                      src={transformedCoupon.merchant?.logo || merchant.logo} 
                                      alt={transformedCoupon.merchant?.name || merchant.name} 
                                      fill
                                      className="object-contain"
                                      sizes="48px"
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
                            </div>
                          );
                        }).filter(Boolean)}
                      </CardContent>
                      {/* Grey overlay on top to make all colors pale */}
                      <div className="absolute inset-0 bg-white/70 rounded-lg pointer-events-none z-10"></div>
                    </Card>
                  </div>
                </section>
              )}

              {/* Related Merchants Section */}
              <section
                id="related-store-coupons"
                aria-labelledby={`${merchant.slug}-related-heading`}
                className="mb-10"
                data-nosnippet="true"
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
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    常見問題
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {merchant.faqs && Array.isArray(merchant.faqs) && merchant.faqs.length > 0 ? (
                    merchant.faqs.map((faq: any, index: number) => {
                      // Handle both parsed format {question, answer} and raw blocks format
                      const question = faq?.question || faq?.q || '';
                      const answer = faq?.answer || faq?.a || '';
                      
                      // If it's still in blocks format, parse it
                      if (!question && !answer && faq.type) {
                        const parsed = parseFAQs([faq]);
                        if (parsed.length > 0) {
                          const parsedFaq = parsed[0];
                          return (
                            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                              <h4 className="font-medium text-pink-600 mb-2 flex items-start gap-2">
                                <span className="text-pink-500 mt-1">?</span>
                                {parsedFaq.question}
                              </h4>
                              <p 
                                className="text-sm text-gray-600 ml-6" 
                                dangerouslySetInnerHTML={{ __html: parsedFaq.answer }}
                              />
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      // Use parsed format directly
                      if (question && answer) {
                        return (
                          <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                            <h4 className="font-medium text-pink-600 mb-2 flex items-start gap-2">
                              <span className="text-pink-500 mt-1">?</span>
                              {question}
                            </h4>
                            <p 
                              className="text-sm text-gray-600 ml-6" 
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
                  <CardTitle className="text-xl font-bold text-gray-800">相關購物分類及攻略</CardTitle>
                </CardHeader>
                <CardContent>
                  {specialOffers && specialOffers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {specialOffers.map((specialOffer) => (
                        <Link
                          key={specialOffer.id}
                          href={`/special-offers/${specialOffer.slug}`}
                        >
                          <Badge variant="outline" className="cursor-pointer px-3 py-1 text-sm border-gray-300 hover:bg-gray-50 transition-colors">
                            {specialOffer.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>暫無相關購物攻略</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How to Use Coupons Guide */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    如何於{merchant.name}使用優惠碼
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

              {/* Contact Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">聯絡我們</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactForm merchantName={merchant.name} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <MerchantSidebar merchant={merchant} coupons={coupons} expiredCoupons={expiredCoupons} hotstoreMerchants={hotstoreMerchants} />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-blue-600 mb-4">
            <Link href="/" className="cursor-pointer hover:underline">
              Dealy.TW 最新優惠平台
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/shop" className="cursor-pointer hover:underline">所有商店</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-600">{merchant.name}</span>
          </div>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Merchant;
