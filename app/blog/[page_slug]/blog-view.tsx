"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facebook, Twitter, Share2, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  }).join('\n');
}

export default function BlogView({ blog }: BlogViewProps) {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);
  const [revealedPromoCodes, setRevealedPromoCodes] = useState<Record<string, boolean>>({});
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
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
            <div className="prose prose-lg max-w-none">
              {/* Table of Contents - Generated from h2 headings */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg border border-orange-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-pink-400 px-6 py-4">
                    <h3 className="font-bold text-lg text-white">📋 本文目錄</h3>
                    <p className="text-sm text-white/90 mt-1">最後更新：{formatDate(blog.updatedAt)}</p>
                  </div>
                  <div className="p-6 bg-white/80">
                    <div className="grid md:grid-cols-2 gap-3">
                      {tableOfContents.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-primary font-bold text-base mt-0.5 flex-shrink-0 bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <button 
                            onClick={() => scrollToSection(item.id)}
                            className="text-sm text-primary hover:text-primary/80 cursor-pointer transition-colors text-left font-medium hover:underline flex-1"
                          >
                            {item.title}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
                            className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8"
                          >
                            {section.h2_title}
                          </h2>
                        )}

                        {/* Section Blog Texts - Rich Text Content */}
                        {section.blog_texts && (
                          <div 
                            className="prose prose-lg max-w-none text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: blocksToHTML(section.blog_texts) 
                            }}
                            style={{
                              whiteSpace: 'pre-wrap', // Preserve line breaks
                            }}
                          />
                        )}

                        {/* Comparison Table - Render after this section's blog_texts */}
                        {section.blog_table && section.blog_table.length > 0 && (
                        <div className="my-8">
                          {section.blog_table[0]?.table_h3 && (
                            <h3 className="font-bold text-lg text-foreground mb-4">
                              {section.blog_table[0].table_h3}
                            </h3>
                          )}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 overflow-hidden">
                            <div className="overflow-x-auto bg-white">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-yellow-100">
                                    <th className="border border-yellow-200 px-3 py-2 text-left font-bold text-sm text-foreground">優惠標題</th>
                                    <th className="border border-yellow-200 px-3 py-2 text-left font-bold text-sm text-foreground">優惠門檻及內容</th>
                                    <th className="border border-yellow-200 px-3 py-2 text-left font-bold text-sm text-foreground">優惠期限</th>
                                    <th className="border border-yellow-200 px-3 py-2 text-left font-bold text-sm text-foreground">專屬頁面或優惠碼</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.blog_table.map((tableRow, rowIndex) => {
                                    const buttonId = `promo-${sectionIndex}-${rowIndex}`;
                                    const isRevealed = revealedPromoCodes[buttonId];
                                    const hasPromoCode = tableRow.table_promo_code && tableRow.table_promo_code.trim() !== '';
                                    
                                    return (
                                      <tr key={tableRow.id || rowIndex} className="hover:bg-yellow-50 transition-colors">
                                        <td className="border border-yellow-200 px-3 py-2 text-sm text-foreground font-medium">
                                          {tableRow.table_title || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-3 py-2 text-sm text-foreground">
                                          {tableRow.table_description || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-3 py-2 text-sm text-foreground">
                                          {tableRow.table_date || '-'}
                                        </td>
                                        <td className="border border-yellow-200 px-3 py-2">
                                          <div 
                                            id={buttonId}
                                            ref={(el) => { buttonRefs.current[buttonId] = el; }}
                                            className="flex items-center gap-2 flex-wrap"
                                          >
                                            {tableRow.landingpage ? (
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="text-xs"
                                                onClick={(e) => handleGetPromoClick(e, tableRow, sectionIndex, rowIndex, tableRow.landingpage)}
                                              >
                                                獲取優惠
                                              </Button>
                                            ) : (
                                              <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                            {isRevealed && hasPromoCode && (
                                              <Badge variant="secondary" className="font-mono text-xs">
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
                            {section.blog_table[0]?.table_date && (
                              <div className="px-6 py-3 bg-yellow-50 text-xs text-muted-foreground border-t border-yellow-200">
                                最後更新：{section.blog_table[0].table_date}
                              </div>
                            )}
                          </div>
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
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
                          className="text-sm text-primary hover:text-primary/80 cursor-pointer transition-colors text-left font-medium hover:underline"
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
      
      <Footer />
    </div>
  );
}
