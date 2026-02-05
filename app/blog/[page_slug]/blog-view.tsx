"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, Share2, MessageCircle, X, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CouponModal from "@/components/CouponModal";
import { ShareDialog } from "@/components/ShareDialog";

interface Blog {
  id: number;
  title: string;
  page_slug: string;
  createdAt: string;
  updatedAt: string;
  intro_text?: string;
  sections: Array<{
    id: number;
    h2_title: string;
    table_h3?: string; // Table title above the table (at section level)
    banner_image: string | null;
    blog_texts: any; // Rich text blocks JSON
    blog_texts_second?: any; // Rich text blocks JSON (below table/coupon)
    section_button_text?: string;
    section_button_link?: string;
    // New table fields
    blog_header_row?: string; // Comma-separated header row
    header_color?: string;
    hover_color?: string;
    border_color?: string;
    blog_content_table?: Array<{  // New content table
      id: number;
      column_1: string;
      column_2: string;
      column_3: string;
      column_4: string;
      column_5: string;
    }>;
    // Backward compatibility
    blog_table?: Array<{  // Each section has its own blog_table
      id: number;
      table_h3: string;
      table_title: string;
      table_description: string;
      table_promo_code: string;
      landingpage: string;
      table_date: string;
      show_code?: boolean;
      header_color?: string;
      hover_color?: string;
      border_color?: string;
    }>;
    blog_coupon_blocks?: Array<{
      coupon_image: string | null;
      coupon_tag?: string;
      short_or_long?: boolean;
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
    show_code?: boolean;
    header_color?: string;
    hover_color?: string;
    border_color?: string;
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
    first_h2?: string;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface BlogViewProps {
  blog: Blog;
  shareUrl?: string;
}

// Helper function to convert Strapi rich text blocks to HTML
// Image URLs are already rewritten in server component
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
    
    // Handle image blocks (URLs already rewritten in server component)
    if (block.type === 'image' && block.image) {
      // Handle different Strapi data structures
      let imageData = block.image;
      if (imageData?.data) {
        imageData = imageData.data;
      }
      
      // Extract URL and alt text from various possible structures
      const imageUrl = imageData?.attributes?.url || imageData?.url || '';
      const altText = imageData?.attributes?.alternativeText || imageData?.alternativeText || block.caption || '';
      
      if (imageUrl) {
        // Escape HTML in alt text
        const escapedAlt = altText.replace(/"/g, '&quot;');
        
        // Wrap in figure if there's a caption
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

export default function BlogView({ blog, shareUrl = '' }: BlogViewProps) {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);
  const [revealedPromoCodes, setRevealedPromoCodes] = useState<Record<string, boolean>>({});
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sidebarColRef = useRef<HTMLDivElement | null>(null);
  const sidebarInnerRef = useRef<HTMLDivElement | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

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
      // 1. Open affiliate link in new tab
      if (landingpage) {
        window.open(landingpage, '_blank');
      }
      
      // 2. In current tab: scroll to the clicked row, reveal the code, and hide the button
      const buttonElement = buttonRefs.current[buttonId];
      if (buttonElement) {
        // Scroll to the row
        setTimeout(() => {
          buttonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      
      // Reveal the promo code (this will hide the button and show the code)
      setRevealedPromoCodes(prev => ({ ...prev, [buttonId]: true }));
    } else {
      // If no promo code: open link in new tab straightly
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

  // Best-effort: derive "最低消費" from coupon title (no fabrication).
  // Examples it can catch:
  // - "最低消費：HKD 500"
  // - "滿HKD500"
  // - "滿 HK$1,500"
  const extractMinSpendFromTitle = (title?: string) => {
    if (!title) return '';
    const t = title.replace(/\s+/g, ' ').trim();
    // Explicit "最低消費" pattern
    const explicit = t.match(/最低消費[:：]?\s*([A-Z]{2,4}|HKD|TWD|NT\$|HK\$)?\s*([\d,]+)/i);
    if (explicit) {
      const cur = (explicit[1] || '').toUpperCase();
      const amt = explicit[2];
      return `${cur ? cur + ' ' : ''}${amt}`.trim();
    }
    // "滿" pattern
    const man = t.match(/滿\s*([A-Z]{2,4}|HKD|TWD|NT\$|HK\$)?\s*([\d,]+)/i);
    if (man) {
      const cur = (man[1] || '').toUpperCase();
      const amt = man[2];
      return `${cur ? cur + ' ' : ''}${amt}`.trim();
    }
    return '';
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

  const sidebarMerchants = blog.related_merchants || [];

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Standard responsive container - narrow desktop style on large screens */}
      <div className="container mx-auto px-4 py-8 max-w-full lg:max-w-5xl">
        {/* Important: don't use `items-start` on the grid here; it prevents the sidebar column from stretching to the row height,
            which breaks sticky / smart-sticky bounds because the sidebar container becomes only as tall as its content. */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 min-w-0 overflow-x-hidden">
            {/* Article Header */}
            <div className="mb-8 min-w-0">
              {/* Categories pills (inside main container width) */}
              {blog.categories && blog.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.categories.map((c) => (
                    <Link key={c.id} href={`/category/${c.slug}`}>
                      <Badge
                        variant="secondary"
                        className="bg-pink-50 text-pink-700 hover:bg-pink-100 cursor-pointer transition-colors"
                      >
                        {c.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight break-words">
                {blog.title}
              </h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src="/newdealylogo_48x25.png" 
                      alt="Dealy Team" 
                      className="aspect-auto object-contain"
                    />
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
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleShare('whatsapp')}>
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.09c0 1.744.413 3.379 1.144 4.826L.06 24l9.305-2.533a11.714 11.714 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.89a11.898 11.898 0 00-3.48-8.413Z" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleShare('share-dialog')}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Article Content */}
            {/* Hide any <hr> coming from rich text (it was showing as an unwanted yellow divider above coupons) */}
            <div className="prose prose-lg max-w-none min-w-0 [&_hr]:hidden">

              {/* Intro paragraph (blog.intro_text) - above the first H2 */}
              {blog.intro_text && blog.intro_text.trim() !== '' && (
                <p className="text-foreground leading-normal mb-6">
                  {blog.intro_text}
                </p>
              )}

              {/* Blog Sections - Mapped from CMS */}
              {blog.sections && blog.sections.length > 0 ? (
                <>
                  {blog.sections.map((section, sectionIndex) => {
                    const sectionId = `section-${section.id || sectionIndex}`;
                    const sectionSlug = section.h2_title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || sectionId;
                    
                    return (
                      <div key={section.id || sectionIndex}>
                        {/* Section h2 Heading */}
                        {section.h2_title && (
                          <h2 
                            id={sectionSlug}
                            className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8 break-words"
                          >
                            {section.h2_title}
                          </h2>
                        )}

                        {/* Section Banner Image (under H2) */}
                        {section.banner_image && (
                          <div className="my-6">
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
                        {((section.blog_content_table && section.blog_content_table.length > 0) || (section.blog_table && section.blog_table.length > 0)) && (
                        <div className="my-8">
                          {(() => {
                            // Use new blog_content_table if available, otherwise fallback to blog_table
                            const useNewTable = section.blog_content_table && section.blog_content_table.length > 0;
                            const tableData = useNewTable ? section.blog_content_table : section.blog_table || [];
                            
                            // Parse header row: use blog_header_row if provided, otherwise use default
                            const headerRowText = (section.blog_header_row || '').toString().trim();
                            const defaultHeaders = ['優惠標題', '優惠門檻及內容', '優惠期限', '專屬頁面或優惠碼'];
                            const headerColumns = headerRowText 
                              ? headerRowText.split(',').map(h => h.trim()).filter(h => h.length > 0)
                              : defaultHeaders;
                            
                            // Get colors from section level (new) or from first row (backward compatibility)
                            const headerColor = (section.header_color || '').toString().trim() || 
                              (useNewTable ? '' : (tableData[0] as any)?.header_color || '').toString().trim();
                            const hoverColor = (section.hover_color || '').toString().trim() || 
                              (useNewTable ? '' : (tableData[0] as any)?.hover_color || '').toString().trim();
                            const borderColor = (section.border_color || '').toString().trim() || 
                              (useNewTable ? '' : (tableData[0] as any)?.border_color || '').toString().trim();
                            const hasCustomTheme = Boolean(headerColor || hoverColor || borderColor);
                            
                            // Determine number of columns based on header count
                            const columnCount = headerColumns.length;
                            const minWidth = columnCount <= 2 ? 'min-w-[420px]' : columnCount === 3 ? 'min-w-[520px]' : 'min-w-[600px]';

                            return (
                              <>
                          {section.table_h3 && (
                            <h3 className="font-bold text-lg text-foreground mb-4 break-words">
                              {section.table_h3}
                            </h3>
                          )}
                          <div
                            className={[
                              "rounded-lg overflow-hidden border",
                              hasCustomTheme ? "" : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200",
                            ].join(" ")}
                            style={
                              hasCustomTheme
                                ? ({
                                    // Use CSS vars so we can keep Tailwind structure while supporting HEX from CMS
                                    ["--bt-header" as any]: headerColor || "#FEF3C7",
                                    ["--bt-hover" as any]: hoverColor || "#FFFBEB",
                                    ["--bt-border" as any]: borderColor || "#FDE68A",
                                  } as React.CSSProperties)
                                : undefined
                            }
                          >
                            {/* Horizontally scrollable table on mobile */}
                            <div 
                              className="overflow-x-auto bg-white" 
                              style={{ 
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'thin'
                              }}
                            >
                              {/* `prose` adds default margins to tables; remove to avoid white space above header */}
                              <table className={`w-full border-collapse ${minWidth} md:min-w-0 m-0`}>
                                <thead>
                                  <tr className={hasCustomTheme ? "bg-[var(--bt-header)]" : "bg-yellow-100"}>
                                    {headerColumns.map((header, colIndex) => (
                                      <th 
                                        key={colIndex}
                                        className={[
                                          hasCustomTheme
                                            ? "border border-[var(--bt-border)] px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6"
                                            : "border border-yellow-200 px-4 py-3 text-left font-bold text-xs text-foreground leading-snug first:pl-6",
                                          // Make "優惠期限" / date column narrower + no-wrap
                                          colIndex === 2 ? "whitespace-nowrap text-[11px] px-3" : "",
                                        ].join(" ")}
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tableData.map((tableRow: any, rowIndex: number) => {
                                    const buttonId = `promo-${sectionIndex}-${rowIndex}`;
                                    
                                    // For new table: use column_1, column_2, etc.
                                    // For old table: use table_title, table_description, etc.
                                    const getCellValue = (colIndex: number): string => {
                                      if (useNewTable) {
                                        const columnKey = `column_${colIndex + 1}` as keyof typeof tableRow;
                                        return (tableRow[columnKey] || '').toString().trim();
                                      } else {
                                        // Backward compatibility: map to old structure
                                        if (colIndex === 0) return tableRow.table_title || '-';
                                        if (colIndex === 1) return tableRow.table_description || '-';
                                        if (colIndex === 2) return tableRow.table_date || '-';
                                        if (colIndex === 3) {
                                          // Action column: show button or promo code
                                          const hasPromoCode = tableRow.table_promo_code && tableRow.table_promo_code.trim() !== '';
                                          const showCode =
                                            tableRow.show_code === true ||
                                            tableRow.show_code === 'true' ||
                                            tableRow.show_code === 'TRUE' ||
                                            tableRow.show_code === 1 ||
                                            tableRow.show_code === '1';

                                          // If CMS says "show_code", always render the code directly (no reveal flow).
                                          if (showCode) {
                                            if (hasPromoCode) return `CODELINK:${tableRow.table_promo_code}`;
                                            if (tableRow.landingpage) return 'LINK_PLACEHOLDER';
                                            return '-';
                                          }

                                          const isRevealed = revealedPromoCodes[buttonId];
                                          if (tableRow.landingpage && !(isRevealed && hasPromoCode)) {
                                            return 'BUTTON_PLACEHOLDER'; // Special marker for button
                                          }
                                          if (isRevealed && hasPromoCode) {
                                            return `CODE:${tableRow.table_promo_code}`; // Special marker for code
                                          }
                                          return '-';
                                        }
                                        return '-';
                                      }
                                    };
                                    
                                    return (
                                      <tr
                                        key={tableRow.id || rowIndex}
                                        className={[
                                          "transition-colors",
                                          hasCustomTheme ? "hover:bg-[var(--bt-hover)]" : "hover:bg-yellow-50",
                                        ].join(" ")}
                                      >
                                        {headerColumns.map((_, colIndex) => {
                                          const cellValue = getCellValue(colIndex);
                                          const isButtonPlaceholder = cellValue === 'BUTTON_PLACEHOLDER';
                                          const isCodePlaceholder = cellValue && typeof cellValue === 'string' && cellValue.startsWith('CODE:');
                                          const isCodeLinkPlaceholder = cellValue && typeof cellValue === 'string' && cellValue.startsWith('CODELINK:');
                                          const isLinkPlaceholder = cellValue === 'LINK_PLACEHOLDER';
                                          
                                          return (
                                            <td 
                                              key={colIndex}
                                              className={[
                                                hasCustomTheme
                                                  ? "border border-[var(--bt-border)] px-4 py-3 text-xs text-foreground break-words leading-snug first:pl-6"
                                                  : "border border-yellow-200 px-4 py-3 text-xs text-foreground break-words leading-snug first:pl-6",
                                                // Date column: smaller + no wrap to avoid stacking
                                                colIndex === 2 ? "whitespace-nowrap break-normal text-[11px] px-3" : "",
                                              ].join(" ")}
                                            >
                                              {isCodeLinkPlaceholder && !useNewTable ? (
                                                <div
                                                  id={buttonId}
                                                  ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                                  className="flex items-center gap-2 flex-wrap"
                                                >
                                                  {tableRow.landingpage ? (
                                                    <a
                                                      href={tableRow.landingpage}
                                                      target="_blank"
                                                      rel="noopener noreferrer nofollow sponsored"
                                                      className="inline-flex items-center no-underline hover:no-underline"
                                                    >
                                                      <span className="font-mono text-xs" data-nosnippet="">
                                                        {cellValue.replace('CODELINK:', '')}
                                                      </span>
                                                    </a>
                                                  ) : (
                                                    <span className="font-mono text-xs" data-nosnippet="">
                                                      {cellValue.replace('CODELINK:', '')}
                                                    </span>
                                                  )}
                                                </div>
                                              ) : isLinkPlaceholder && !useNewTable ? (
                                                <div
                                                  id={buttonId}
                                                  ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                                  className="flex items-center gap-2 flex-wrap"
                                                >
                                                  {tableRow.landingpage ? (
                                                    <a
                                                      href={tableRow.landingpage}
                                                      target="_blank"
                                                      rel="noopener noreferrer nofollow sponsored"
                                                      className="text-xs no-underline hover:no-underline"
                                                    >
                                                      獲取優惠
                                                    </a>
                                                  ) : (
                                                    '-'
                                                  )}
                                                </div>
                                              ) : isButtonPlaceholder && !useNewTable ? (
                                                <div 
                                                  id={buttonId}
                                                  ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                                  className="flex items-center gap-2 flex-wrap"
                                                >
                                                  {tableRow.landingpage && (
                                                    <Button 
                                                      size="sm" 
                                                      variant="outline"
                                                      className="text-[11px] h-8 px-3"
                                                      onClick={(e) => handleGetPromoClick(e, tableRow, sectionIndex, rowIndex, tableRow.landingpage)}
                                                    >
                                                      獲取優惠
                                                    </Button>
                                                  )}
                                                </div>
                                              ) : isCodePlaceholder && !useNewTable ? (
                                                <div 
                                                  id={buttonId}
                                                  ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                                  className="flex items-center gap-2 flex-wrap"
                                                >
                                                  <span className="font-mono text-xs" data-nosnippet="">
                                                    {cellValue.replace('CODE:', '')}
                                                  </span>
                                                </div>
                                              ) : (
                                                cellValue || '-'
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                              </>
                            );
                          })()}
                        </div>
                        )}

                        {/* Coupon tickets (blog_sections.blog_coupon) */}
                        {section.blog_coupon_blocks && section.blog_coupon_blocks.length > 0 && (
                          <div className="my-6 not-prose">
                            {(() => {
                              // Group by style only; each coupon can have its own tag (from its blog_coupon block).
                              const groups = new Map<string, { long: boolean; items: any[] }>();
                              for (const block of section.blog_coupon_blocks || []) {
                                const long = Boolean(block.short_or_long);
                                const key = `${long ? 'long' : 'short'}`;
                                const list = (block.coupons || []).map((c) => ({
                                  ...c,
                                  _coupon_image: block.coupon_image, // IMPORTANT: long style uses blog_coupon.coupon_image
                                  _coupon_tag: (block.coupon_tag || '').trim(),
                                }));
                                const existing = groups.get(key);
                                if (existing) existing.items.push(...list);
                                else groups.set(key, { long, items: list });
                              }

                              const entries = Array.from(groups.values()).filter((g) => g.items.length > 0);
                              if (entries.length === 0) return null;

                              return (
                                <div className="space-y-4">
                                  {entries.map((g, gi) => (
                                    <div key={`${g.long}-${gi}`}>
                                      {/* short_or_long = false: current ticket design */}
                                      {!g.long ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                                          {g.items.map((c: any) => (
                                            <div
                                              key={c.id}
                                              id={`coupon-${c.id}`}
                                              className="relative w-full bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-2xl overflow-hidden shadow-sm"
                                            >
                                              <div className="flex h-full">
                                                {/* Left content */}
                                                <div className="flex-1 px-5 py-3 min-w-0">
                                                  {/* Short style: use coupon_tag as the category tag (no hardcoded label) */}
                                                  {c._coupon_tag ? (
                                                    <Badge className="mb-0.5 bg-pink-100 text-pink-700 hover:bg-pink-100 text-[10px] px-2 py-0.5 rounded-full leading-none inline-flex w-fit">
                                                      {c._coupon_tag}
                                                    </Badge>
                                                  ) : null}
                                                  <div className="text-[14px] font-semibold text-gray-900 leading-snug break-words line-clamp-2">
                                                    {c.coupon_title || '-'}
                                                  </div>

                                                  {/* Keep code hidden on card; shown in popup modal */}
                                                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                    {c._coupon_image ? (
                                                      // eslint-disable-next-line @next/next/no-img-element
                                                      <img
                                                        src={c._coupon_image}
                                                        alt="coupon"
                                                        className="w-5 h-5 rounded-full object-cover border border-pink-200 bg-white"
                                                      />
                                                    ) : (
                                                      <span className="w-5 h-5 rounded-full bg-white border border-pink-200 flex items-center justify-center text-[10px] text-pink-500">
                                                        券
                                                      </span>
                                                    )}
                                                    <span className="truncate">點擊「領取」查看詳情</span>
                                                  </div>
                                                </div>

                                                {/* Dashed divider */}
                                                <div className="relative w-px bg-transparent">
                                                  <div className="absolute inset-y-4 left-0 border-l border-dashed border-pink-200" />
                                                </div>

                                                {/* Right value + button */}
                                                <div className="w-[132px] bg-gradient-to-b from-pink-100 to-pink-200 px-3 py-3 flex flex-col items-center justify-center gap-2">
                                                  <div className="text-center w-full">
                                                    <div className="text-xl font-extrabold text-pink-600 leading-tight break-words">
                                                      {c.value || ''}
                                                    </div>
                                                    {/* Only show min spend if we can derive it from title (no fabrication) */}
                                                    {(() => {
                                                      const ms = extractMinSpendFromTitle(c.coupon_title);
                                                      if (!ms) return null;
                                                      return (
                                                        <div className="mt-1 text-[11px] text-pink-700/80">
                                                          最低消費：{ms}
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>

                                                  <Button
                                                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold rounded-full h-9 px-5 text-sm"
                                                    onClick={() => handleBlogCouponClick(c)}
                                                  >
                                                    領取
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        /* short_or_long = true: new "list card" showcase style (image uses blog_coupon.coupon_image) */
                                        <div className="space-y-4">
                                          {g.items.map((c: any) => (
                                            <div
                                              key={c.id}
                                              id={`coupon-${c.id}`}
                                              className="relative flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
                                            >
                                              <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                                <Image
                                                  src={c._coupon_image || "/placeholder.svg"}
                                                  alt={c.coupon_title || "coupon"}
                                                  fill
                                                  className="object-cover"
                                                  unoptimized
                                                />
                                              </div>

                                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                  {c._coupon_tag ? (
                                                    <Badge className="mb-2 bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-2 py-0.5 rounded-full leading-none inline-flex w-fit">
                                                      {c._coupon_tag}
                                                    </Badge>
                                                  ) : null}
                                                  <div className="text-base font-bold text-foreground line-clamp-2">
                                                    {c.coupon_title || '-'}
                                                  </div>
                                                </div>

                                                <div className="mt-3 flex items-end justify-between gap-3">
                                                  <div className="text-sm text-muted-foreground font-medium">
                                                    {c.value || ''}
                                                  </div>
                                                  <Button
                                                    className="bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg h-9 px-5 text-sm"
                                                    onClick={() => handleBlogCouponClick(c)}
                                                  >
                                                    立即預訂
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Section Blog Texts (Second) - Below table/coupon */}
                        {section.blog_texts_second && Array.isArray(section.blog_texts_second) && section.blog_texts_second.length > 0 && (
                          <div
                            className="mt-4 text-base text-foreground leading-normal break-words min-w-0"
                            dangerouslySetInnerHTML={{
                              __html: blocksToHTML(section.blog_texts_second)
                            }}
                            style={{
                              lineHeight: '1.5',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                            }}
                          />
                        )}

                        {/* Section CTA Button */}
                        {section.section_button_text && section.section_button_link && (
                          <div className="mt-6 not-prose">
                            <Link
                              href={section.section_button_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold rounded-lg h-11 text-base">
                                {section.section_button_text}
                              </Button>
                            </Link>
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
                      <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={relatedBlog.thumbnail || "/placeholder.svg"}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                          部落格
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                          {relatedBlog.title}
                        </h4>
                        {relatedBlog.first_h2 ? (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {relatedBlog.first_h2}
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            {formatDate(relatedBlog.updatedAt)}
                          </p>
                        )}
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
                    {sidebarMerchants.length > 0 ? (
                      sidebarMerchants.slice(0, 6).map((m) => (
                        <Link
                          key={m.id}
                          href={`/shop/${m.slug}`}
                          className="flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors"
                        >
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={m.logo || "/placeholder.svg"}
                              alt={m.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground leading-tight mb-1 line-clamp-2">
                              {m.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">查看優惠</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">尚未設定推薦商店</p>
                    )}
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
      <ShareDialog 
        open={isShareDialogOpen} 
        onOpenChange={setIsShareDialogOpen} 
        url={shareUrl} 
        title={blog.title} 
      />
    </div>
  );
}
