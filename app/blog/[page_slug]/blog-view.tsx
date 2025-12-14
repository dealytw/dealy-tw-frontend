"use client";
import { useState, useEffect } from "react";
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
  sections: any[]; // Will be mapped later
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

export default function BlogView({ blog }: BlogViewProps) {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);

  // Dummy data for design - will be replaced with actual CMS data later
  const dummyCategories = ["旅遊", "優惠", "折扣碼", "日本"];
  const dummyHeroImage = "https://res.klook.com/image/upload/q_85/c_fill,w_1360/v1671187857/blog/dnes5bjnwmom1cajn96e.webp";
  
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
    // Generate table of contents from dummy data (will be from actual content later)
    setTableOfContents(dummyTableOfContents);
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

            {/* Hero Image */}
            <div className="mb-8">
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={dummyHeroImage}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Table of Contents - Content Start */}
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

            {/* Article Content - Dummy Content for Design */}
            <div className="prose prose-lg max-w-none">
              {/* Dummy paragraph */}
              <p className="text-foreground leading-relaxed mb-6">
                2025日本櫻花季即將到來！近年因為氣溫上升，今年櫻花也比往年提早開花，賞櫻前掌握櫻花開花和滿開的時間，才能看見最美櫻花景色～計劃在2025日本櫻花季時到日本賞櫻嗎？旅行從Dealy開始，小編將持續更新2025日本櫻花滿開預測、日本賞櫻景點推薦、交通資訊等，一起來趟日本賞櫻之旅吧！
              </p>

              {/* Dummy heading */}
              <h2 
                id="intro"
                className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8"
              >
                2025日本櫻花｜簡介
              </h2>

              <p className="text-foreground leading-relaxed mb-6">
                日本櫻花季通常從3月底開始，一直持續到5月初。每年的開花時間會因氣候變化而有所不同，因此掌握準確的櫻花前線預測非常重要。
              </p>

              {/* Dummy promotional section */}
              <div className="my-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h3 className="text-xl font-bold text-primary mb-6 text-center">
                  🌟日韓賞櫻1折起，跟Dealy一起去看滿天粉櫻🌟
                </h3>
                
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    🌸日本賞櫻推薦行程
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-foreground hover:text-primary cursor-pointer transition-colors">
                        東京櫻花必看｜日式屋形船遊船體驗
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-foreground hover:text-primary cursor-pointer transition-colors">
                        東京近郊櫻花｜河津早櫻 & 河津七瀧 & 草莓無限吃一日遊
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-6 text-center">
                  <button className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-2 mx-auto">
                    👉 更多日韓賞櫻1折起優惠
                  </button>
                </div>
              </div>

              {/* Dummy heading */}
              <h2 
                id="recommended-tours"
                className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8"
              >
                🌸日本賞櫻推薦行程
              </h2>

              {/* Dummy list */}
              <ul className="list-disc pl-6 mb-6">
                <li className="text-foreground mb-2">東京櫻花必看｜日式屋形船遊船體驗</li>
                <li className="text-foreground mb-2">大阪賞櫻勝地｜大阪城公園櫻花季</li>
                <li className="text-foreground mb-2">京都櫻花名所｜清水寺夜間特別參拜</li>
                <li className="text-foreground mb-2">奈良櫻花景點｜吉野山千本櫻</li>
              </ul>

              {/* Comparison Table */}
              <div className="my-8">
                <div className="overflow-x-auto rounded-lg border border-muted">
                  <table className="w-full">
                    <thead className="bg-yellow-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-foreground border border-yellow-500">內容</th>
                        <th className="px-4 py-3 text-left font-bold text-foreground border border-yellow-500">例子（以當期為準）</th>
                        <th className="px-4 py-3 text-left font-bold text-foreground border border-yellow-500">使用重點</th>
                        <th className="px-4 py-3 text-left font-bold text-foreground border border-yellow-500">風險位</th>
                      </tr>
                    </thead>
                    <tbody className="bg-yellow-50">
                      {dummyComparisonData.map((deal, index) => (
                        <tr key={index} className="border-b border-yellow-200">
                          <td className="px-4 py-3 font-medium text-foreground border border-yellow-200">{deal.type}</td>
                          <td className="px-4 py-3 text-foreground border border-yellow-200">{deal.example}</td>
                          <td className="px-4 py-3 text-foreground border border-yellow-200">{deal.usage}</td>
                          <td className="px-4 py-3 text-foreground border border-yellow-200">{deal.risk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promotional Banner */}
              <div className="my-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <h3 className="text-xl font-bold text-primary mb-2">
                  🌟日韓賞櫻1折起，跟Dealy一起去看滿天粉櫻🌟
                </h3>
                <p className="text-muted-foreground mb-4">
                  立即預訂最優惠的日本賞櫻行程，體驗不一樣的櫻花季節！
                </p>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  立即預訂優惠行程
                </Button>
              </div>
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
