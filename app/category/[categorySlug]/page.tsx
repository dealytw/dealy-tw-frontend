"use client";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponCard from "@/components/CouponCard";
import { useState, useEffect } from "react";

interface Merchant {
  id: string;
  name: string;
  logo: string;
  description: string;
}

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiry: string;
  usageCount: number;
  merchant: {
    name: string;
    logo: string;
  };
}

const Category = () => {
  const params = useParams();
  const categorySlug = params?.categorySlug as string;
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock popular merchants for category
    setMerchants([
      {
        id: "1",
        name: "Qatar Airways",
        logo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100&h=100&fit=crop&crop=center",
        description: "卡塔爾航空"
      },
      {
        id: "2", 
        name: "Wing On Travel",
        logo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop&crop=center",
        description: "永安旅遊"
      },
      {
        id: "3",
        name: "Trip.com",
        logo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&h=100&fit=crop&crop=center", 
        description: "Trip.com"
      },
      {
        id: "4",
        name: "Agoda",
        logo: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100&h=100&fit=crop&crop=center",
        description: "Agoda"
      },
      {
        id: "5",
        name: "Expedia", 
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop&crop=center",
        description: "Expedia"
      },
      {
        id: "6",
        name: "Hotels.com",
        logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop&crop=center",
        description: "Hotels.com"
      },
      {
        id: "7", 
        name: "Rakuten Travel",
        logo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100&h=100&fit=crop&crop=center",
        description: "樂天旅行"
      },
      {
        id: "8",
        name: "Klook",
        logo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop&crop=center",
        description: "Klook"
      }
    ]);

    // Mock coupons for category
    setCoupons([
      {
        id: "1",
        code: "QATAR4999",
        title: "Qatar Airways卡塔爾航空 - 精選優惠 ($4999折扣)",
        description: "最高數額法：連住 2-3 晚 或適合早餐升等的房型等易獲選",
        discount: "$4,999",
        expiry: "2025-03-31",
        usageCount: 50,
        merchant: {
          name: "Qatar Airways",
          logo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=60&h=60&fit=crop&crop=center"
        }
      },
      {
        id: "2", 
        code: "WINGON20",
        title: "永安旅遊 Wing On Travel 溫泉之旅 20% 折扣",
        description: "日本溫泉酒店預訂優惠，包含早餐和晚餐",
        discount: "20% OFF",
        expiry: "2025-04-15",
        usageCount: 125,
        merchant: {
          name: "Wing On Travel",
          logo: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=60&h=60&fit=crop&crop=center"
        }
      },
      {
        id: "3",
        code: "TRIP300",
        title: "Trip.com 機票酒店套餐 $300 優惠碼",
        description: "預訂機票+酒店套餐享受額外折扣",
        discount: "$300",
        expiry: "2025-05-01", 
        usageCount: 89,
        merchant: {
          name: "Trip.com",
          logo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=60&h=60&fit=crop&crop=center"
        }
      },
      {
        id: "4",
        code: "AGODA15",
        title: "Agoda 酒店預訂 15% 折扣優惠",
        description: "全球酒店預訂享受15%折扣",
        discount: "15% OFF",
        expiry: "2025-04-30",
        usageCount: 203,
        merchant: {
          name: "Agoda", 
          logo: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=60&h=60&fit=crop&crop=center"
        }
      },
      {
        id: "5",
        code: "EXPEDIA500", 
        title: "Expedia 度假套餐 $500 折扣",
        description: "預訂度假套餐享受 $500 折扣優惠",
        discount: "$500",
        expiry: "2025-06-15",
        usageCount: 67,
        merchant: {
          name: "Expedia",
          logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=60&h=60&fit=crop&crop=center"
        }
      },
      {
        id: "6",
        code: "HOTELS25",
        title: "Hotels.com 酒店預訂 25% 優惠",
        description: "精選酒店預訂享受25%折扣",
        discount: "25% OFF", 
        expiry: "2025-07-01",
        usageCount: 156,
        merchant: {
          name: "Hotels.com",
          logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=60&h=60&fit=crop&crop=center"
        }
      }
    ]);
  }, [categorySlug]);

  const getCategoryTitle = (slug: string | undefined) => {
    const categoryMap: { [key: string]: string } = {
      'travel': '旅遊',
      'food': '美食',
      'shopping': '購物',
      'entertainment': '娛樂',
      'lifestyle': '生活'
    };
    return categoryMap[slug || ''] || '分類';
  };

  const handleCouponClick = (coupon: Coupon) => {
    console.log('Coupon clicked:', coupon);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Category Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getCategoryTitle(categorySlug)}
          </h1>
        </div>

        {/* Popular Merchants Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
            香港最新折扣優惠
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8">
            {merchants.map((merchant) => (
              <div key={merchant.id} className="text-center group cursor-pointer">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white p-2 group-hover:shadow-xl transition-shadow">
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={merchant.logo} 
                      alt={merchant.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                <p className="text-xs text-gray-600 leading-tight px-2">{merchant.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coupons Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {getCategoryTitle(categorySlug)}優惠券
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onClick={() => handleCouponClick(coupon)}
              />
            ))}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;
