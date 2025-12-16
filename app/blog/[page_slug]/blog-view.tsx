"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, Twitter, Share2, MessageCircle, X, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CouponModal from "@/components/CouponModal";

interface Blog {
  id: number;
  title: string;
  page_slug: string;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    id: number;
    h2_title: string;
    table_h3?: string; // Table title above the table (at section level)
    banner_image: string | null;
    blog_texts: any; // Rich text blocks JSON
    blog_table?: Array<{  // Each section has its own blog_table
      id: number;
      table_h3: string;
      table_title: string;
      table_description: string;
      table_promo_code: string;
      landingpage: string;
      table_date: string;
    }>;
    blog_coupon_blocks?: Array<{
      coupon_image: string | null;
      coupons: Array<{
        id: string;
        coupon_title: string;
        value: string;
        code?: string;
        affiliate_link: string;
        coupon_type?: "promo_code" | "coupon" | "discount" | string;
        expires_at?: string;
      }>;
    }>;
  }>;
  blog_table?: Array<{  // Keep for backward compatibility, but should use section.blog_table
    id: number;
    table_h3: string;
    table_title: string;
    table_description: string;
    table_promo_code: string;
    landingpage: string;
    table_date: string;
  }>;
  related_merchants: Array<{
    id: number;
    name: string;
    slug: string;
    logo: string | null;
  }>;
  related_blogs: Array<{
    id: number;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    thumbnail: string | null;
  }>;
}

interface BlogViewProps {
  blog: Blog;
}

// Helper function to convert Strapi rich text blocks to HTML
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
      // Use span instead of p to avoid paragraph spacing, or use p with no margin
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

export default function BlogView({ blog }: BlogViewProps) {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);
  const [revealedPromoCodes, setRevealedPromoCodes] = useState<Record<string, boolean>>({});
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sidebarColRef = useRef<HTMLDivElement | null>(null);
  const sidebarInnerRef = useRef<HTMLDivElement | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  // Debug: Log blog_table data
  useEffect(() => {
    console.log('Blog object:', blog);
    console.log('Blog table data:', blog.blog_table);
    console.log('Blog table length:', blog.blog_table?.length);
    console.log('Blog table exists?', !!blog.blog_table);
  }, [blog]);

  // Handle scroll to button and reveal promo code on page load (if hash exists)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        const buttonId = hash.replace('#', '');
        const buttonElement = buttonRefs.current[buttonId];
        if (buttonElement) {
          setTimeout(() => {
            buttonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setRevealedPromoCodes(prev => ({ ...prev, [buttonId]: true }));
          }, 100);
        }
      }
    }
  }, []);

  // Open coupon modal from hash (#coupon-{id}) in the SAME way as shop page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.startsWith('#coupon-')) return;

    const couponId = hash.replace('#coupon-', '');
    const el = document.getElementById(`coupon-${couponId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Find coupon data from section coupon blocks
    const allCoupons =
      (blog.sections || [])
        .flatMap((s) => s.blog_coupon_blocks || [])
        .flatMap((b) => b.coupons || []);

    const c = allCoupons.find((x) => x.id === couponId);
    if (!c) return;

    // Transform into CouponModal shape (merchant logo uses component-level coupon_image if available)
    const blockWithCoupon =
      (blog.sections || [])
        .flatMap((s) => s.blog_coupon_blocks || [])
        .find((b) => (b.coupons || []).some((x) => x.id === couponId));
    const logo = blockWithCoupon?.coupon_image || "/placeholder.svg";

    const transformed = {
      id: c.id,
      code: c.code || undefined,
      title: c.coupon_title || '',
      description: '',
      discount: c.value || '',
      discountValue: c.value || '',
      expiry: c.expires_at || '長期有效',
      usageCount: 0,
      steps: '',
      terms: '',
      affiliateLink: c.affiliate_link || '#',
      coupon_type: (c.coupon_type || (c.code ? 'promo_code' : 'coupon')) as any,
      merchant: {
        name: 'Dealy',
        logo,
      }
    };

    setSelectedCoupon(transformed);
    setIsCouponModalOpen(true);
  }, [blog.sections]);

  const handleGetPromoClick = (e: React.MouseEvent, tableRow: any, sectionIndex: number, rowIndex: number, landingpage: string) => {
    e.preventDefault();
    const buttonId = `promo-${sectionIndex}-${rowIndex}`;
    const hasPromoCode = tableRow.table_promo_code && tableRow.table_promo_code.trim() !== '';
    
    if (hasPromoCode) {
      // If promo code exists:
      // 1. Open landing page in current tab
      if (landingpage) {
        window.location.href = landingpage;
      }
      
      // 2. Open new tab to same blog page with hash, scroll to button, reveal promo code
      const currentUrl = window.location.href.split('#')[0];
      const newTabUrl = `${currentUrl}#${buttonId}`;
      window.open(newTabUrl, '_blank');
      
      // Also reveal in current tab before navigation
      setRevealedPromoCodes(prev => ({ ...prev, [buttonId]: true }));
    } else {
      // If no promo code: open link in new tab
      if (landingpage) {
        window.open(landingpage, '_blank');
      }
    }
  };

  // Blog coupon button behavior (same procedure as "normal coupon button modal"):
  // - Open new tab to THIS blog page with #coupon-{id} (auto scroll + auto open modal)
  // - Redirect current tab to affiliate link immediately
  const handleBlogCouponClick = (coupon: any) => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.href.split('#')[0];
    const couponHashUrl = `${baseUrl}#coupon-${coupon.id}`;
    window.open(couponHashUrl, '_blank', 'noopener,noreferrer');
    if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
      window.location.href = coupon.affiliate_link;
    }
  };

  // Dummy data for design - will be replaced with actual CMS data later
  const dummyCategories = ["旅遊", "優惠", "折扣碼", "日本"];
  
  // Dummy table of contents - will be generated from actual headings later
  const dummyTableOfContents = [
    { id: "intro", title: "2025日本櫻花｜簡介" },
    { id: "recommended-tours", title: "🌸日本賞櫻推薦行程" },
    { id: "korea-tours", title: "🌸韓國賞櫻推薦行程" },
    { id: "forecast-timeline", title: "2025日本櫻花｜何時開？櫻花前線預測滿開時程表" },
    { id: "regional-sakura", title: "2025日本櫻花｜各地櫻花整理" },
  ];

  // Dummy comparison table data
  const dummyComparisonData = [
    {
      type: "生日折扣券",
      example: "滿額直減／全單95折",
      usage: "生日月內用，可能不可疊平台碼",
      risk: "名額／門檻限制、品類排除"
    },
    {
      type: "會員日加碼",
      example: "生日月搭會員日更抵",
      usage: "比較「活動價 vs 生日券」何者更高",
      risk: "會員日人流大、熱門品易售罄"
    },
    {
      type: "免運／運費券",
      example: "指定金額免運",
      usage: "與主券二擇一或同享（視條款）",
      risk: "地區限制、承運商時效"
    },
    {
      type: "贈品／試用裝",
      example: "熱門品牌小樣、旅行裝",
      usage: "記得勾選贈品：部分需滿額",
      risk: "贈品數量有限、售完即止"
    }
  ];

  // Dummy related articles
  const dummyRelatedArticles = [
    {
      id: 1,
      title: "2025日本入境｜Visit Japan Web教學，台灣人入境日本免排隊",
      date: "2024年7月24日",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "2025台中東勢推薦｜38個台中必訪景點！遺產古蹟、文化園區",
      date: "2024年4月22日",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "2025台北buffet吃到飽｜32間推薦餐廳，五星飯店自助餐廳",
      date: "2024年5月7日",
      image: "/placeholder.svg"
    }
  ];

  useEffect(() => {
    // Generate table of contents from actual blog sections
    if (blog.sections && blog.sections.length > 0) {
      const toc = blog.sections
        .filter((section) => section.h2_title)
        .map((section, index) => ({
          id: `section-${section.id || index}`,
          title: section.h2_title,
        }));
      setTableOfContents(toc);
    } else {
      // Fallback to dummy data if no sections
      setTableOfContents(dummyTableOfContents);
    }
  }, [blog.sections]);

  /**
   * Smart sticky sidebar (desktop only)
   * Goal (your spec):
   * - Main content + sidebar scroll normally in parallel
   * - When user has "reached the end of the sidebar" (its bottom would start disappearing / leave white space),
   *   keep it visible (stop moving further) without flicker.
   *
   * Implementation:
   * - Desktop only (lg)
   * - If sidebar fits in viewport: simple CSS sticky-top
   * - If sidebar is taller than viewport: keep sidebar inner ABSOLUTE inside a full-height column and
   *   adjust its `top` ONLY when needed to keep either the bottom (scrolling down) or top (scrolling up)
   *   within the viewport offsets. No fixed/absolute mode switching => no flicker.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const col = sidebarColRef.current;
    const inner = sidebarInnerRef.current;
    if (!col || !inner) return;

    const mql = window.matchMedia("(min-width: 1024px)"); // Tailwind lg

    const TOP_OFFSET = 96; // header spacing (top-24)
    const BOTTOM_OFFSET = 24; // breathing room

    let lastScrollY = window.scrollY;
    let rafPending = false;
    let mode: "short" | "tall" | null = null;
    let currentTopDoc: number | null = null; // inner top in document coordinates (for tall mode)
    // Smooth animation state (for tall mode). We animate the Y offset within the column.
    let targetTopPx: number | null = null;
    let currentTopPx: number | null = null;
    let animRaf: number | null = null;
    let lastAnimTs: number | null = null;

    // Cached measurements (avoid forcing layout on every scroll frame)
    let colTopDoc = 0;
    let colBottomDoc = 0;
    let innerH = 0;
    let availableH = 0;
    let minTopDoc = 0;
    let maxTopDoc = 0;
    let metricsReady = false;

    const clear = () => {
      inner.style.position = "";
      inner.style.top = "";
      inner.style.left = "";
      inner.style.width = "";
      inner.style.transform = "";
      inner.style.willChange = "";
      targetTopPx = null;
      currentTopPx = null;
      lastAnimTs = null;
      if (animRaf != null) {
        window.cancelAnimationFrame(animRaf);
        animRaf = null;
      }
    };

    const applyShort = () => {
      if (mode === "short") return;
      mode = "short";
      currentTopDoc = null;
      targetTopPx = null;
      currentTopPx = null;
      clear();
      inner.style.position = "sticky";
      inner.style.top = `${TOP_OFFSET}px`;
      inner.style.width = "100%";
    };

    const applyTall = (naturalTopDoc?: number) => {
      if (mode !== "tall") {
        mode = "tall";
        clear();
        inner.style.position = "absolute";
        // anchor at top=0, then we move via transform translateY for smoothness
        inner.style.top = "0px";
        inner.style.left = "0px";
        inner.style.width = "100%";
        inner.style.willChange = "transform";
      }
      if (naturalTopDoc != null) currentTopDoc = naturalTopDoc;
    };

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const recomputeMetrics = () => {
      if (!mql.matches) return;

      col.style.position = "relative";

      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      // These doc-coordinates are invariant while scrolling; only change on resize/layout changes.
      const rect = col.getBoundingClientRect();
      colTopDoc = rect.top + scrollY;
      colBottomDoc = rect.bottom + scrollY;

      innerH = inner.offsetHeight;
      availableH = viewportH - TOP_OFFSET - BOTTOM_OFFSET;

      minTopDoc = colTopDoc;
      maxTopDoc = colBottomDoc - innerH;
      metricsReady = true;
    };

    const applyTransformPx = (yPx: number) => {
      // GPU-friendly; avoids layout reflow from changing `top` continuously
      inner.style.transform = `translate3d(0, ${yPx}px, 0)`;
    };

    const startAnimation = () => {
      if (animRaf != null) return;
      const tick = (ts: number) => {
        animRaf = null;
        if (mode !== "tall" || targetTopPx == null) {
          lastAnimTs = null;
          return;
        }

        if (currentTopPx == null) currentTopPx = targetTopPx;

        const dt = lastAnimTs == null ? 16 : Math.min(64, ts - lastAnimTs);
        lastAnimTs = ts;

        // Exponential smoothing: keep it smooth but more synchronized with scroll.
        // Use adaptive tau: big gaps catch up faster, small gaps remain smooth.
        const dist = Math.abs(targetTopPx - currentTopPx);
        const TAU_MS = dist > 320 ? 45 : dist > 160 ? 70 : 90;
        let alpha = 1 - Math.exp(-dt / TAU_MS);
        // Clamp alpha to avoid sluggishness on fast scroll and avoid jitter on tiny moves
        alpha = Math.min(0.65, Math.max(0.18, alpha));

        currentTopPx = currentTopPx + (targetTopPx - currentTopPx) * alpha;

        // Snap when close enough to prevent micro-jitter
        if (Math.abs(targetTopPx - currentTopPx) < 0.35) {
          currentTopPx = targetTopPx;
        }

        applyTransformPx(currentTopPx);

        if (currentTopPx !== targetTopPx) {
          animRaf = window.requestAnimationFrame(tick);
        } else {
          // done
          lastAnimTs = null;
        }
      };

      animRaf = window.requestAnimationFrame(tick);
    };

    const update = () => {
      if (!mql.matches) {
        mode = null;
        currentTopDoc = null;
        metricsReady = false;
        clear();
        col.style.position = "";
        return;
      }

      const viewportH = window.innerHeight;
      const scrollY = window.scrollY;
      const directionDown = scrollY > lastScrollY;
      lastScrollY = scrollY;
      if (!metricsReady) recomputeMetrics();

      // Fits in viewport => simple sticky-top
      if (innerH <= availableH) {
        applyShort();
        return;
      }

      // Tall sidebar => absolute + adjust `top` as needed
      if (mode !== "tall") {
        // capture natural position before we take it out of flow
        const naturalTop = inner.getBoundingClientRect().top + scrollY;
        applyTall(naturalTop);
      } else {
        applyTall();
      }

      if (maxTopDoc <= minTopDoc) {
        // Defensive: if layout is weird, just pin to top of column
        currentTopDoc = minTopDoc;
        targetTopPx = 0;
        currentTopPx = 0;
        applyTransformPx(0);
        return;
      }

      if (currentTopDoc == null) currentTopDoc = clamp(colTopDoc, minTopDoc, maxTopDoc);

      const viewportTopDoc = scrollY + TOP_OFFSET;
      const viewportBottomDoc = scrollY + viewportH - BOTTOM_OFFSET;

      // Core rule:
      // - scrolling DOWN: if bottom is above viewportBottom => move down so bottom aligns to viewportBottom
      // - scrolling UP: if top is below viewportTop => move up so top aligns to viewportTop
      if (directionDown) {
        if (currentTopDoc + innerH < viewportBottomDoc) {
          currentTopDoc = viewportBottomDoc - innerH;
        }
      } else {
        if (currentTopDoc > viewportTopDoc) {
          currentTopDoc = viewportTopDoc;
        }
      }

      currentTopDoc = clamp(currentTopDoc, minTopDoc, maxTopDoc);
      // Set the target position inside the column; animation will ease toward it.
      const nextTarget = currentTopDoc - colTopDoc;
      if (targetTopPx == null || Math.abs(targetTopPx - nextTarget) > 0.25) {
        targetTopPx = nextTarget;
        // If first time, jump to avoid weird initial offset, otherwise animate
        if (currentTopPx == null) {
          currentTopPx = targetTopPx;
          applyTransformPx(currentTopPx);
        } else {
          startAnimation();
        }
      }
    };

    const onScrollOrResize = () => {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(() => {
        rafPending = false;
        update();
      });
    };

    // Observe size changes to keep metrics accurate without recalculating on every scroll
    const ro = new ResizeObserver(() => {
      metricsReady = false;
      // Keep currentTopDoc stable but recompute bounds
      onScrollOrResize();
    });
    ro.observe(col);
    ro.observe(inner);

    // init + listeners
    metricsReady = false;
    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    const onResize = () => {
      metricsReady = false;
      onScrollOrResize();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const onMql = () => {
      // reset + re-measure when breakpoint changes
      mode = null;
      currentTopDoc = null;
      clear();
      update();
    };
    mql.addEventListener?.("change", onMql);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      mql.removeEventListener?.("change", onMql);
      clear();
      col.style.position = "";
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog.title;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {/* Use related merchants as categories for now - will be mapped properly later */}
            {blog.related_merchants && blog.related_merchants.length > 0 ? (
              blog.related_merchants.slice(0, 4).map((merchant) => (
                <Link key={merchant.id} href={`/shop/${merchant.slug}`}>
                  <Badge 
                    variant="secondary" 
                    className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                  >
                    {merchant.name}
                  </Badge>
                </Link>
              ))
            ) : (
              // Fallback to dummy categories
              dummyCategories.map((category, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                >
                  {category}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Standard responsive container - narrow desktop style on large screens */}
      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-5xl">
        {/* Important: don't use `items-start` on the grid here; it prevents the sidebar column from stretching to the row height,
            which breaks sticky / smart-sticky bounds because the sidebar container becomes only as tall as its content. */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 min-w-0 overflow-x-hidden">
            {/* Article Header */}
            <div className="mb-8 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight break-words">
                {blog.title}
              </h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="/placeholder.svg" alt="Dealy Team" />
                    <AvatarFallback>DT</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">Dealy Team</div>
                    <div className="text-sm text-muted-foreground">
                      Last updated {formatDate(blog.updatedAt)}
                    </div>
                  </div>
                </div>
                
                {/* Social Share Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleShare('facebook')}>
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleShare('twitter')}>
                    <Twitter className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleShare('copy')}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Article Content - Dummy Content for Design */}
            <div className="prose prose-lg max-w-none min-w-0">

              {/* Blog Sections - Mapped from CMS */}
              {blog.sections && blog.sections.length > 0 ? (
                <>
                  {blog.sections.map((section, sectionIndex) => {
                    const sectionId = `section-${section.id || sectionIndex}`;
                    const sectionSlug = section.h2_title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || sectionId;
                    
                    return (
                      <div key={section.id || sectionIndex}>
                        {/* Section Banner Image */}
                        {section.banner_image && (
                          <div className="my-8">
                            <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={section.banner_image}
                                alt={section.h2_title || 'Section banner'}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Section h2 Heading */}
                        {section.h2_title && (
                          <h2 
                            id={sectionSlug}
                            className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8 break-words"
                          >
                            {section.h2_title}
                          </h2>
                        )}

                        {/* Section Blog Texts - Rich Text Content */}
                        {section.blog_texts && (
                          <div 
                            className="text-base text-foreground leading-normal break-words min-w-0"
                            dangerouslySetInnerHTML={{ 
                              __html: blocksToHTML(section.blog_texts) 
                            }}
                            style={{
                              lineHeight: '1.5',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                            }}
                          />
                        )}

                        {/* Comparison Table - Render after this section's blog_texts */}
                        {section.blog_table && section.blog_table.length > 0 && (
                        <div className="my-8">
                          {section.table_h3 && (
                            <h3 className="font-bold text-lg text-foreground mb-4 break-words">
                              {section.table_h3}
                            </h3>
                          )}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 overflow-hidden">
                            {/* Horizontally scrollable table on mobile */}
                            <div 
                              className="overflow-x-auto bg-white" 
                              style={{ 
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'thin'
                              }}
                            >
                              {/* `prose` adds default margins to tables; remove to avoid white space above header */}
                              <table className="w-full border-collapse min-w-[600px] md:min-w-0 m-0">
                                <thead>
                                  <tr className="bg-yellow-100">
                                    <th className="border border-yellow-200 px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6">優惠標題</th>
                                    <th className="border border-yellow-200 px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6">優惠門檻及內容</th>
                                    <th className="border border-yellow-200 px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6">優惠期限</th>
                                    <th className="border border-yellow-200 px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6">專屬頁面或優惠碼</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.blog_table.map((tableRow, rowIndex) => {
                                    const buttonId = `promo-${sectionIndex}-${rowIndex}`;
                                    const isRevealed = revealedPromoCodes[buttonId];
                                    const hasPromoCode = tableRow.table_promo_code && tableRow.table_promo_code.trim() !== '';
                                    
                                    return (
                                      <tr key={tableRow.id || rowIndex} className="hover:bg-yellow-50 transition-colors">
                                        <td className="border border-yellow-200 px-4 py-3 text-xs text-foreground font-medium break-words leading-snug first:pl-6">
                                          {tableRow.table_title || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-4 py-3 text-xs text-foreground break-words leading-snug first:pl-6">
                                          {tableRow.table_description || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-4 py-3 text-xs text-foreground break-words leading-snug first:pl-6">
                                          {tableRow.table_date || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-4 py-3 first:pl-6">
                                          <div 
                                            id={buttonId}
                                            ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                            className="flex items-center gap-2 flex-wrap"
                                          >
                                            {tableRow.landingpage ? (
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="text-[11px] h-8 px-3"
                                                onClick={(e) => handleGetPromoClick(e, tableRow, sectionIndex, rowIndex, tableRow.landingpage)}
                                              >
                                                獲取優惠
                                              </Button>
                                            ) : (
                                              <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                            {isRevealed && hasPromoCode && (
                                              <Badge variant="secondary" className="font-mono text-[11px]">
                                                {tableRow.table_promo_code}
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        )}

                        {/* Coupon tickets (blog_sections.blog_coupon) */}
                        {section.blog_coupon_blocks && section.blog_coupon_blocks.length > 0 && (
                          <div className="my-6 not-prose">
                            {section.blog_coupon_blocks.map((block, blockIdx) => (
                              <div key={blockIdx} className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <div className="flex gap-4 min-w-max py-2">
                                  {block.coupons.map((c) => (
                                    <div
                                      key={c.id}
                                      id={`coupon-${c.id}`}
                                      className="relative w-[320px] sm:w-[360px] bg-[#fff7ef] border border-[#ffd8b3] rounded-2xl overflow-hidden shadow-sm"
                                    >
                                      {/* Ticket cut-outs */}
                                      <div className="absolute left-[92px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border border-[#ffd8b3]" />
                                      <div className="absolute left-[92px] top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-white rounded-full border border-[#ffd8b3]" />

                                      <div className="flex h-full">
                                        {/* Left value block */}
                                        <div className="w-[110px] px-4 py-4 flex flex-col justify-between">
                                          <div className="text-xs text-orange-600 font-semibold">
                                            適用於全部活動
                                          </div>
                                          <div className="mt-2 text-2xl font-extrabold text-orange-600 leading-none">
                                            {c.value || ''}
                                          </div>
                                          {block.coupon_image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={block.coupon_image}
                                              alt="coupon"
                                              className="mt-3 w-7 h-7 rounded-full object-cover border border-orange-200 bg-white"
                                            />
                                          ) : (
                                            <div className="mt-3 w-7 h-7 rounded-full bg-white border border-orange-200 flex items-center justify-center text-xs text-orange-400">
                                              券
                                            </div>
                                          )}
                                        </div>

                                        {/* Dashed divider */}
                                        <div className="relative w-px bg-transparent">
                                          <div className="absolute inset-y-4 left-0 border-l border-dashed border-orange-200" />
                                        </div>

                                        {/* Right content */}
                                        <div className="flex-1 px-4 py-4">
                                          <div className="text-sm font-semibold text-gray-900 leading-snug break-words">
                                            {c.coupon_title || '-'}
                                          </div>
                                          <div className="mt-1 text-xs text-gray-600">
                                            {c.code ? `優惠碼：${c.code}` : ''}
                                          </div>
                                          <div className="mt-3 flex justify-end">
                                            <Button
                                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full h-8 px-4 text-sm"
                                              onClick={() => handleBlogCouponClick(c)}
                                            >
                                              領取
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                // Fallback: Show dummy content if no sections
                <>
                  {/* Section 1: Banner Image */}
                  <div className="my-8">
                    <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-muted">
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
                        <p className="text-muted-foreground text-sm">Section Banner Image (1200x300px recommended)</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: h2 Heading */}
                  <h2 
                    id="intro"
                    className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8"
                  >
                    2025日本櫻花｜簡介
                  </h2>

                  {/* Section 1: Blog Paragraphs */}
                  <p className="text-foreground leading-relaxed mb-6">
                    2025日本櫻花季即將到來！近年因為氣溫上升，今年櫻花也比往年提早開花，賞櫻前掌握櫻花開花和滿開的時間，才能看見最美櫻花景色～計劃在2025日本櫻花季時到日本賞櫻嗎？旅行從Dealy開始，小編將持續更新2025日本櫻花滿開預測、日本賞櫻景點推薦、交通資訊等，一起來趟日本賞櫻之旅吧！
                  </p>

                  <p className="text-foreground leading-relaxed mb-6">
                    日本櫻花季通常從3月底開始，一直持續到5月初。每年的開花時間會因氣候變化而有所不同，因此掌握準確的櫻花前線預測非常重要。
                  </p>
                </>
              )}
            </div>

            {/* Blog Coupon Section (ticket style) - rendered inside each blog section */}
            {blog.sections?.some((s) => (s.blog_coupon_blocks || []).length > 0) && (
              <div className="my-6 not-prose" />
            )}

            {/* Related Blog Posts */}
            {blog.related_blogs && blog.related_blogs.length > 0 && (
              <div className="my-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="text-2xl font-bold text-foreground">🔍 延伸閱讀</h3>
                </div>
                
                <div className="space-y-6">
                  {blog.related_blogs.map((relatedBlog) => (
                    <Link
                      key={relatedBlog.id}
                      href={`/blog/${relatedBlog.slug}`}
                      className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {relatedBlog.thumbnail && (
                        <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={relatedBlog.thumbnail}
                            alt={relatedBlog.title}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                            部落格
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                          {relatedBlog.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {formatDate(relatedBlog.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (smart sticky on desktop) */}
          <div ref={sidebarColRef} className="lg:col-span-1 min-w-0">
            <div ref={sidebarInnerRef}>
            <div className="space-y-6">
              {/* Related Articles */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-foreground">私心推薦</h3>
                  <div className="space-y-4">
                    {dummyRelatedArticles.map((article) => (
                      <div key={article.id} className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground leading-tight mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">{article.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Table of Contents */}
              <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg border border-orange-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 px-4 py-3">
                  <h3 className="font-bold text-lg text-white">📋 本文目錄</h3>
                  <p className="text-sm text-white/90 mt-1">最後更新：{formatDate(blog.updatedAt)}</p>
                </div>
                <div className="p-4 bg-white/80">
                  <div className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-primary font-semibold text-sm mt-0.5 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <button 
                          onClick={() => scrollToSection(item.id)}
                          className="text-sm text-primary hover:text-primary/80 cursor-pointer transition-colors text-left font-medium hover:underline break-words"
                        >
                          {item.title}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2 text-primary">開始你的旅程</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    發現更多優惠券和折扣碼
                  </p>
                  <Link href="/shop">
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                      瀏覽所有優惠
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add bottom padding on mobile to account for sticky TOC button */}
      <div className="lg:hidden h-14" />
      
      <Footer />
      
      {/* Mobile TOC Sticky Button - Bottom Center (like Klook) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <Button
          onClick={() => setIsTOCOpen(true)}
          className="w-full rounded-none h-14 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
          size="lg"
        >
          <List className="w-5 h-5 text-white" />
          <span className="text-white font-medium">本文目錄</span>
        </Button>
      </div>

      {/* Mobile TOC Drawer - Slides in from right (like Klook) */}
      {isTOCOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setIsTOCOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-2xl z-[60] overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-foreground" />
                  <h3 className="font-bold text-lg text-foreground">內容重點</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTOCOpen(false)}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* TOC List */}
              <div className="space-y-1">
                {tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      scrollToSection(item.id);
                      setIsTOCOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <span className="text-foreground leading-relaxed break-words">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Coupon Modal (opened via #coupon-{id} in new tab) */}
      <CouponModal open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen} coupon={selectedCoupon} />
    </div>
  );
}
