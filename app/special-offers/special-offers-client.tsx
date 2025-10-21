"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealyCouponCard from "@/components/DealyCouponCard";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Topic {
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
  topic: Topic;
  featuredMerchants: FeaturedMerchant[];
  flashDeals: FlashDeal[];
}

const SpecialOffersClient = ({ topic, featuredMerchants, flashDeals }: SpecialOffersClientProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");

  const filters = ["全部", "最新優惠碼", "最新折扣"];

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
    
    // Open affiliate link in same tab
    window.open(coupon.affiliate_link, '_self');
  };

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
            ✨ 限時搶購！2025最新8月快閃優惠一覽 🔔
          </h1>
          {topic.intro && (
            <p className="text-muted-foreground mb-4">
              {topic.intro}
            </p>
          )}
          <p className="text-sm text-orange-600 font-medium">
            ⭐ 現在處於銷售高峰期的商店，或請請優先下波訂看所有自時最新優惠，趕緊限時買團！立即搶購！
          </p>
        </div>

        {/* Featured Merchants Section */}
        {featuredMerchants.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              優惠主題熱門商店
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {featuredMerchants.map((merchant) => (
                <div 
                  key={merchant.id}
                  className="flex flex-col items-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => window.open(merchant.link, '_self')}
                >
                  <div className="w-16 h-16 mb-3 flex items-center justify-center bg-white rounded-lg p-2">
                    <img 
                      src={merchant.logo}
                      alt={merchant.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1 text-center">
                    {merchant.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flash Deals Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              快閃優惠
            </h2>
            
            <Button 
              variant="outline" 
              className="text-sm flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
            {flashDeals.map((coupon) => (
              <div key={coupon.id} id={`coupon-${coupon.id}`}>
                <DealyCouponCard
                  coupon={coupon}
                  onClick={() => handleCouponClick(coupon)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal 
        open={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
        coupon={selectedCoupon}
      />
      
      <Footer />
    </div>
  );
};

export default SpecialOffersClient;
