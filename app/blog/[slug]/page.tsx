"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Facebook, Twitter, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

const BlogPost = () => {
  const [tableOfContents, setTableOfContents] = useState<{id: string, title: string}[]>([]);

  // Sample data - will be dynamic later
  const blogPost = {
    id: 1,
    title: "【2025日本櫻花】最新日本賞櫻預測，24個必去賞櫻景點",
    author: {
      name: "Dealy Team",
      avatar: "/placeholder.svg",
      publishDate: "Last updated 2025年4月29日"
    },
    categories: ["東京", "大阪", "北海道", "京都", "福岡", "沖繩", "廣島", "熊本", "日本"],
    heroImage: "https://res.klook.com/image/upload/q_85/c_fill,w_1360/v1671187857/blog/dnes5bjnwmom1cajn96e.webp",
    content: [
      {
        type: "paragraph",
        text: "2025日本櫻花季即將到來！近年因為氣溫上升，今年櫻花也比往年提早開花，賞櫻前掌握櫻花開花和滿開的時間，才能看見最美櫻花景色～計劃在2025日本櫻花季時到日本賞櫻嗎？旅行從Dealy開始，小編將持續更新2025日本櫻花滿開預測、日本賞櫻景點推薦、交通資訊等，一起來趟日本賞櫻之旅吧！"
      },
        {
          type: "heading",
          level: 2,
          text: "2025日本櫻花｜簡介",
          id: "sakura-intro"
        },
        {
          type: "paragraph",
          text: "日本櫻花季通常從3月底開始，一直持續到5月初。每年的開花時間會因氣候變化而有所不同，因此掌握準確的櫻花前線預測非常重要。"
        },
        {
          type: "promotional-section",
          title: "🌟日韓賞櫻1折起，跟Dealy一起去看滿天粉櫻🌟",
          sections: [
            {
              title: "🌸日本賞櫻推薦行程",
              items: [
                "東京櫻花必看｜日式屋形船遊船體驗",
                "東京近郊櫻花｜河津早櫻 & 河津七瀧 & 草莓無限吃一日遊", 
                "富士山河口湖賞櫻｜新倉山淺間公園&河口湖大石公園一日遊",
                "九州櫻花｜熊本城阿蘇火山.草千里.阿蘇神社.黑川溫泉一日遊"
              ]
            },
            {
              title: "🌸韓國賞櫻推薦行程",
              items: [
                "韓國最大春季慶典｜鎮海櫻花節一日遊",
                "首爾/釜山出發｜鎮海軍港節 - 櫻花慶典一日遊",
                "首爾出發賞櫻花｜韓國賞櫻 & 春季賞花一日遊",
                "釜山賞櫻趣｜甘川文化村 & 海雲臺藍線公園一日遊"
              ]
            }
          ]
        },
        {
          type: "heading",
          level: 2,
          text: "🌸日本賞櫻推薦行程",
          id: "recommended-tours"
        },
        {
          type: "list",
          items: [
            "東京櫻花必看｜日式屋形船遊船體驗",
            "大阪賞櫻勝地｜大阪城公園櫻花季", 
            "京都櫻花名所｜清水寺夜間特別參拜",
            "奈良櫻花景點｜吉野山千本櫻"
          ]
        },
        {
          type: "heading",
          level: 2,
          text: "🌸韓國賞櫻推薦行程",
          id: "korea-tours"
        },
        {
          type: "list",
          items: [
            "韓國最大春季慶典｜鎮海櫻花節一日遊",
            "首爾/釜山出發｜鎮海軍港節 - 櫻花慶典一日遊",
            "首爾出發賞櫻花｜韓國賞櫻 & 春季賞花一日遊",
            "釜山賞櫻趣｜甘川文化村 & 海雲臺藍線公園一日遊"
          ]
        },
      {
        type: "heading",
        level: 2,
        text: "2025日本櫻花｜何時開？櫻花前線預測滿開時程表",
        id: "forecast-timeline"
      },
      {
        type: "paragraph",
        text: "根據最新的氣象預測，2025年日本櫻花開花時間預計會比往年提前。以下是各主要城市的預測開花時間..."
      },
      {
        type: "heading", 
        level: 2,
        text: "2025日本櫻花｜各地櫻花整理",
        id: "regional-sakura"
      },
      {
        type: "paragraph",
        text: "日本各地都有其獨特的賞櫻景點，從北海道的五稜郭公園到沖繩的八重岳櫻之森公園，每個地區都有不同的櫻花品種和最佳觀賞時期。"
      }
    ],
  };

  // Generate table of contents from headings in content
  useEffect(() => {
    const headings = blogPost.content
      .filter(item => item.type === 'heading' && item.level === 2)
      .map(item => ({
        id: item.id || item.text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
        title: item.text
      }));
    setTableOfContents(headings);
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

  const dealComparisonData = [
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

  const relatedArticles = [
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

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {blogPost.categories.map((category, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
              >
                {category}
              </Badge>
            ))}
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
                {blogPost.title}
              </h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={blogPost.author.avatar} alt={blogPost.author.name} />
                    <AvatarFallback>{blogPost.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{blogPost.author.name}</div>
                    <div className="text-sm text-muted-foreground">{blogPost.author.publishDate}</div>
                  </div>
                </div>
                
                {/* Social Share Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Twitter className="w-4 h-4 text-blue-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="mb-8">
              <img 
                src={blogPost.heroImage} 
                alt={blogPost.title}
                className="w-full h-[400px] object-cover rounded-lg"
              />
            </div>

            {/* Table of Contents - Content Start */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg border border-orange-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 px-6 py-4">
                  <h3 className="font-bold text-lg text-white">📋 本文目錄</h3>
                  <p className="text-sm text-white/90 mt-1">最後更新：2025-09-05</p>
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

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {blogPost.content.map((section, index) => {
                switch (section.type) {
                  case 'paragraph':
                    return (
                      <p key={index} className="text-foreground leading-relaxed mb-6">
                        {section.text}
                      </p>
                    );
                  case 'heading':
                    const headingId = section.id || section.text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
                    return (
                      <h2 
                        key={index} 
                        id={headingId}
                        className="text-2xl font-bold text-foreground mt-8 mb-4 scroll-mt-8"
                      >
                        {section.text}
                      </h2>
                    );
                  case 'list':
                    return (
                      <ul key={index} className="list-disc pl-6 mb-6">
                        {section.items?.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-foreground mb-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    );
                  case 'promotional-section':
                    return (
                      <div key={index} className="my-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h3 className="text-xl font-bold text-primary mb-6 text-center">
                          {section.title}
                        </h3>
                        
                        {section.sections?.map((subsection, subIndex) => (
                          <div key={subIndex} className="mb-6 last:mb-0">
                            <h4 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                              {subsection.title}
                            </h4>
                            <ul className="space-y-2">
                              {subsection.items?.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  <span className="text-foreground hover:text-primary cursor-pointer transition-colors">
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        
                        <div className="mt-6 text-center">
                          <button className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-2 mx-auto">
                            👉 更多日韓賞櫻1折起優惠
                          </button>
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>

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
                    {dealComparisonData.map((deal, index) => (
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

            {/* Related Blog Posts */}
            <div className="my-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-2xl font-bold text-foreground">🔍 日本旅遊延伸閱讀</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src="https://res.klook.com/image/upload/q_85/c_fill,w_300,h_200/v1671187857/blog/dnes5bjnwmom1cajn96e.webp" 
                      alt="大阪櫻花2025"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      當地玩樂
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Your world of JOY
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      【大阪櫻花2025】花期預測、大阪賞櫻20個景點推薦
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      2025大阪櫻花季即將開跑！2025年大阪櫻花前線預測小編幫你們整注，一有開花、滿開預測消息就會更新給大家各位...
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src="https://res.klook.com/image/upload/q_85/c_fill,w_300,h_200/v1671187857/blog/dnes5bjnwmom1cajn96e.webp" 
                      alt="京都櫻花季"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      當地玩樂
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Your world of JOY
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      【2025京都櫻花季】開花時間預測，15大景點京都賞櫻去！
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      2025京都櫻花季來了！一年一度的賞櫻盛典即將開跑，本次將帶大家走訪千年古都「京都」，在古剎庭園與雅的氛...
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src="https://res.klook.com/image/upload/q_85/c_fill,w_300,h_200/v1671187857/blog/dnes5bjnwmom1cajn96e.webp" 
                      alt="東京櫻花季"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      當地玩樂
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Your world of JOY
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      東京櫻花季2025》東京櫻花開了！日本櫻花季正式展開，11大賞櫻夜櫻景點推薦
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      2025東京櫻花季即將登場，東京櫻花情報編輯一次幫你整理好！包含東京櫻花滿開時間預測、櫻花景點等，讓你第...
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src="https://res.klook.com/image/upload/q_85/c_fill,w_300,h_200/v1671187857/blog/dnes5bjnwmom1cajn96e.webp" 
                      alt="福岡賞櫻"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      當地玩樂
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Your world of JOY
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      2025福岡賞櫻》預計三月底開花！台灣人必去8個九州熊本櫻花秘境
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      作為九州的櫻花重點地區，福岡不僅有大濠公園、西公園等經典賞櫻勝地，更有隱密可見的街道櫻花樹，讓整座城...
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src="https://res.klook.com/image/upload/q_85/c_fill,w_300,h_200/v1671187857/blog/dnes5bjnwmom1cajn96e.webp" 
                      alt="九州櫻花季"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      當地玩樂
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Your world of JOY
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      2025九州櫻花季》九州9大賞櫻景點，交通、花期資訊一次看
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      2025年的九州櫻花季即將到來，無論你是櫻花控還是賞櫻新手，這篇2025九州櫻花攻略都為你準備了最完整的賞...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Related Articles */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-foreground">私心推薦</h3>
                  <div className="space-y-4">
                    {relatedArticles.map((article) => (
                      <div key={article.id} className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
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
                  <p className="text-sm text-white/90 mt-1">最後更新：2025-09-05</p>
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
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                    瀏覽所有優惠
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
        
        <Footer />
      </div>
    );
  };
  
  export default BlogPost;
