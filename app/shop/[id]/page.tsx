"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { ChevronRight, HelpCircle, Clock, User, Calendar, ArrowUp, Heart } from "lucide-react";
import { getMerchantLogo } from "@/lib/data";
import { TransformedShop } from "@/types/cms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CouponCard from "@/components/CouponCard";
import RelatedMerchantCouponCard from "@/components/RelatedMerchantCouponCard";

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
        if (item.children && Array.isArray(item.children)) {
          return item.children.map((child: any) => {
            if (child.bold) return `<strong>${child.text || ""}</strong>`;
            if (child.italic) return `<em>${child.text || ""}</em>`;
            return child.text || "";
          }).join("");
        }
        return item.text || "";
      }
      if (item.type === "list") {
        const listItems = item.children?.map((child: any) => {
          if (child.children && Array.isArray(child.children)) {
            return child.children.map((grandChild: any) => grandChild.text || "").join("");
          }
          return child.text || "";
        }).join("\n• ") || "";
        return `• ${listItems}`;
      }
      return item.text || "";
    }).join("\n\n");
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

const Merchant = () => {
  const params = useParams();
  const id = params?.id as string;
  const [merchant, setMerchant] = useState<TransformedShop | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [relatedMerchants, setRelatedMerchants] = useState<any[]>([]);
  const filters = ["全部", "最新優惠", "日本", "韓國", "本地", "內地", "信用卡"];

  // Auto scroll to coupon if hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#coupon-')) {
      const couponId = hash.replace('#coupon-', '');
      const element = document.getElementById(`coupon-${couponId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Find and open the corresponding coupon modal
        const coupon = coupons.find(c => c.id === couponId);
        if (coupon) {
          setSelectedCoupon(coupon);
          setIsModalOpen(true);
        }
      }
    }
  }, [coupons]);

  // Fetch merchant data and coupons from Strapi
  useEffect(() => {
    const fetchData = async () => {
      try {
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        
        // Fetch merchant data
        const merchantResponse = await fetch(`/api/shop/${id}?market=${market}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!merchantResponse.ok) {
          throw new Error(`HTTP error! status: ${merchantResponse.status}`);
        }
        
        const merchantData = await merchantResponse.json();
        setMerchant(merchantData);

        // Fetch related merchants
        try {
          const relatedMerchantsResponse = await fetch(`/api/related-merchants?merchant=${id}&market=${market}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (relatedMerchantsResponse.ok) {
            const relatedData = await relatedMerchantsResponse.json();
            setRelatedMerchants(relatedData.relatedMerchants || []);
          } else {
            console.error('Failed to fetch related merchants:', relatedMerchantsResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching related merchants:', error);
        }

        // Fetch coupons for this merchant
        const couponsResponse = await fetch(`/api/shop/${id}/coupons?market=${market}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json();
          console.log('Raw coupons data received:', couponsData);
          
          // Validate coupon data structure
          if (!Array.isArray(couponsData)) {
            console.error('Invalid coupons data format - expected array, got:', typeof couponsData);
            setCoupons([]);
            setExpiredCoupons([]);
            return;
          }
          
          // Log coupon validation issues
          couponsData.forEach((coupon: any, index: number) => {
            if (!coupon.id) {
              console.error(`Coupon at index ${index} missing ID:`, coupon);
            }
            if (!coupon.coupon_title) {
              console.warn(`Coupon ${coupon.id} missing title`);
            }
            if (!coupon.merchant) {
              console.error(`Coupon ${coupon.id} missing merchant data:`, coupon);
            }
            if (coupon.value === null || coupon.value === undefined) {
              console.warn(`Coupon ${coupon.id} has null/undefined value field`);
            }
            // Debug coupon_status
            console.log(`Coupon ${coupon.id} status:`, coupon.coupon_status);
          });
          
          // Separate active and expired coupons by coupon_status field
          const activeCoupons = couponsData.filter((coupon: any) => {
            const isActive = coupon.coupon_status === "active";
            console.log(`Coupon ${coupon.id} (${coupon.coupon_title}) status: "${coupon.coupon_status}" -> Active: ${isActive}`);
            return isActive;
          });
          const expiredCoupons = couponsData.filter((coupon: any) => {
            const isExpired = coupon.coupon_status === "expired";
            console.log(`Coupon ${coupon.id} (${coupon.coupon_title}) status: "${coupon.coupon_status}" -> Expired: ${isExpired}`);
            return isExpired;
          });
          
          console.log(`Found ${activeCoupons.length} active coupons and ${expiredCoupons.length} expired coupons`);
          setCoupons(activeCoupons);
          setExpiredCoupons(expiredCoupons);
        } else {
          console.error('Failed to fetch coupons:', couponsResponse.status, couponsResponse.statusText);
          const errorText = await couponsResponse.text();
          console.error('Error response:', errorText);
          setCoupons([]);
          setExpiredCoupons([]);
        }
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        // Fallback data for development
        setMerchant({
          id: 1,
          name: "Trip.com",
          slug: id,
          logo: null,
          description: "Trip.com 是中國領先的線上旅遊平台",
          website: "hk.trip.com",
          affiliateLink: "https://hk.trip.com",
          pageLayout: "coupon", // Default layout
          isFeatured: false,
          market: "HK",
          seoTitle: "",
          seoDescription: "",
          canonicalUrl: "",
          priority: 0,
          robots: "index,follow",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString()
        });
        setCoupons([]);
        setExpiredCoupons([]);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Auto-scroll to section based on hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleCouponClick = (coupon: any) => {
    // Transform the coupon for the modal
    const transformedCoupon = {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description, // Already transformed
      discount: coupon.discount,
      expiry: coupon.expiry,
      terms: coupon.terms, // Already transformed
      merchant: coupon.merchant,
      affiliateLink: coupon.affiliateLink
    };
    
    setSelectedCoupon(transformedCoupon);
    setIsModalOpen(true);

    // Open affiliate link in same tab and popup in new tab (as requested)
    window.open(coupon.affiliateLink, '_self');
    setTimeout(() => {
      window.open(window.location.href + `#coupon-${coupon.id}`, '_blank');
    }, 100);
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
      usageCount: coupon.user_count || 0,
      steps: renderRichText(coupon.description), // Map description to steps with formatting preserved
      terms: extractTextFromRichText(coupon.editor_tips), // Map editor_tips to terms (⚠️ 溫馨提示)
      affiliateLink: coupon.affiliate_link || '#',
      coupon_type: coupon.coupon_type,
      merchant: {
        name: coupon.merchant.name || 'Unknown Merchant',
        logo: coupon.merchant.logo || '',
      }
    };
  };

  if (!merchant) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto py-12">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

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
      
      <main className="container mx-auto px-4 py-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2">
            {/* Page Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center lg:hidden">
                {merchant.logo && (
                  <img 
                    src={merchant.logo} 
                    alt={merchant.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mb-2">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900">
                    {merchant.name}優惠碼2025｜9月最新折扣與信用卡優惠
                  </h1>
                  <p className="text-xs text-gray-600 sm:mb-1">
                    最近更新： 2025/09/04 （每日更新）
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {merchant.description || `${merchant.name}優惠碼限時登場！透過信用卡專屬折扣或指定 Promo Code，即享機票、酒店、高鐵優惠，助你即省更多。`}
            </p>
            
            {/* Filter Section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {merchant.name}優惠碼總整理（每日更新）｜Promo code／Discount code
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.map(filter => (
                  <Badge 
                    key={filter} 
                    variant={activeFilter === filter ? "default" : "outline"} 
                    className={`cursor-pointer px-3 py-1 text-sm ${activeFilter === filter ? "bg-blue text-white border-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`} 
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Continued Content */}
            <div className="space-y-8">
              {/* Active Coupons */}
              <div className="space-y-0">
                {coupons.map(coupon => {
                  const transformedCoupon = transformCoupon(coupon);
                  if (!transformedCoupon) {
                    console.error('Skipping invalid coupon:', coupon);
                    return null;
                  }
                  return (
                    <div key={coupon.id} id={`coupon-${coupon.id}`}>
                      <DealyCouponCard coupon={transformedCoupon} onClick={() => handleCouponClick(coupon)} />
                    </div>
                  );
                }).filter(Boolean)}
              </div>

              {/* Expired Coupons Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">已過期但仍可嘗試</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expiredCoupons.length > 0 ? (
                    expiredCoupons.map(coupon => {
                      const transformedCoupon = transformCoupon(coupon);
                      if (!transformedCoupon) {
                        console.error('Skipping invalid expired coupon:', coupon);
                        return null;
                      }
                      return (
                        <div key={coupon.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            <div className="text-center min-w-[80px]">
                              <div className="w-12 h-12 mb-2 mx-auto flex items-center justify-center">
                                <img src={transformedCoupon.merchant?.logo || merchant.logo} alt={transformedCoupon.merchant?.name || merchant.name} className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="text-lg font-bold text-purple-600">{transformedCoupon.discount}</div>
                              <div className="text-sm text-gray-500">優惠</div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">折扣碼/優惠</div>
                              <h3 className="text-sm font-medium text-blue-600 mb-2">{transformedCoupon.title}</h3>
                              <Button className="bg-purple-400 hover:bg-purple-500 text-white text-sm px-6 py-2 mb-2" onClick={() => handleCouponClick(coupon)}>
                                獲取優惠券 ➤
                              </Button>
                              <p className="text-xs text-gray-600">{transformedCoupon.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>暫無已過期的優惠券</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Merchants Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">同類商戶折扣優惠</CardTitle>
                </CardHeader>
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
                      暫無相關商戶優惠
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    常見問題
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {merchant.faqs && merchant.faqs.length > 0 ? (
                    parseFAQs(merchant.faqs).map((faq, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <h4 className="font-medium text-pink-600 mb-2 flex items-start gap-2">
                          <span className="text-pink-500 mt-1">?</span>
                          {faq.question}
                        </h4>
                        <p 
                          className="text-sm text-gray-600 ml-6" 
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      暫無常見問題
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Blog Categories */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">相關購物分類及攻略</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["最新快閃優惠", "旅遊優惠大集合", "優惠碼使用教學", "信用卡優惠大全", "會員攻略"].map((category, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer px-3 py-1 text-sm border-gray-300 hover:bg-gray-50">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* How to Use Coupons Guide */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    💗 如何於{merchant.name}使用優惠碼
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {merchant.how_to && merchant.how_to.length > 0 ? (
                    parseHowTo(merchant.how_to).map((section, index) => (
                      <div key={index} className="space-y-3">
                        <h4 className="font-semibold text-gray-800 text-lg">
                          {index + 1}. {section.title}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-2 whitespace-pre-line">
                          {section.content}
                        </div>
                      </div>
                    ))
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
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      ✍️ 你的名字
                    </Label>
                    <Input id="name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      💗 你的電郵
                    </Label>
                    <Input id="email" type="email" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      ✍️ 你的信息 （歡迎任何意見或問題）
                    </Label>
                    <Textarea id="message" rows={6} className="mt-1" />
                  </div>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
                    📧提交
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <MerchantSidebar merchant={merchant} coupons={coupons} expiredCoupons={expiredCoupons} />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-blue-600 mb-4">
            <span className="cursor-pointer hover:underline">Dealy.HK 最新優惠平台</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="cursor-pointer hover:underline">所有商店</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-600">{merchant.name}</span>
          </div>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
    </div>
  );
};

export default Merchant;