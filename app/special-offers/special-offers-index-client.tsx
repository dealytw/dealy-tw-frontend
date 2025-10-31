"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Tag } from "lucide-react";

interface SpecialOffer {
  id: number;
  title: string;
  slug: string;
  intro?: string;
  seo_title?: string;
  seo_description?: string;
  link: string;
}

interface SpecialOffersIndexClientProps {
  specialOffers: SpecialOffer[];
}

const SpecialOffersIndexClient = ({ specialOffers }: SpecialOffersIndexClientProps) => {
  const [activeFilter, setActiveFilter] = useState("全部");

  const filters = ["全部", "最新優惠", "熱門優惠"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-muted/30 border-b border-border py-2 px-4">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
            <a href="#" className="text-primary hover:underline ml-1">了解更多</a>
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ✨ 特別優惠專區 🔔
          </h1>
          <p className="text-muted-foreground mb-4">
            精選最新特別優惠與限時活動，助您以最優惠價格入手心水產品
          </p>
          <p className="text-sm text-orange-600 font-medium">
            ⭐ 定期更新最新優惠資訊，立即查看所有特別優惠！
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
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

        {/* Special Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {specialOffers.map((specialOffer) => (
            <Card 
              key={specialOffer.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => window.open(specialOffer.link, '_self')}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    特別優惠
                  </Badge>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {specialOffer.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm line-clamp-3 mb-4">
                  {specialOffer.intro || specialOffer.seo_description || '精選特別優惠與限時活動'}
                </CardDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  查看優惠詳情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            className="text-sm flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground mx-auto"
          >
            <Plus className="w-4 h-4" />
            提交優惠券
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SpecialOffersIndexClient;
