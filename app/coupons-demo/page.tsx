"use client";
import { useState, useEffect } from "react";
import CouponCard from "@/components/CouponCard";
import { CouponData } from "@/lib/coupon-queries";

const CouponsDemo = () => {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const response = await fetch("/api/coupons?market=tw");
        const result = await response.json();
        if (result.ok && result.data) {
          setCoupons(result.data);
        }
      } catch (error) {
        console.error("Error fetching coupons:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCoupons();
  }, []);

  const handleGetCode = (coupon: CouponData) => {
    console.log("Get code clicked for:", coupon.coupon_title);
    // Handle affiliate link redirect or code copying
    if (coupon.affiliate_link) {
      window.open(coupon.affiliate_link, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-lg text-gray-600">Loading coupons...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Coupon Cards Demo
          </h1>
          <p className="text-lg text-gray-600">
            Reusable coupon card component with CMS integration
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {coupons.length > 0 ? (
            coupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onGetCode={handleGetCode}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600 mb-4">
                No coupons available
              </div>
              <p className="text-gray-500">
                Add coupons in your Strapi CMS to see them here.
              </p>
            </div>
          )}
        </div>

        {/* Demo with mock data */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Demo with Mock Data
          </h2>
          <div className="max-w-4xl mx-auto">
            <CouponCard
              coupon={{
                id: "demo-1",
                coupon_title: "Olive Young OY SALE 開跑 🚨 限時限量「最高6折」全單券+品牌加碼券 🎉",
                coupon_type: "promo_code",
                value: "6折",
                code: "OY60OFF",
                expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
                user_count: 50,
                description: "全站券+指定商品加碼券可以一起用，買得越多折得越多 (數量有限，先到先得)！",
                editor_tips: "• 此優惠券僅限台灣地區使用\n• 不可與其他優惠同時使用\n• 有效期至2025年12月31日\n• 如有疑問請聯繫客服",
                affiliate_link: "https://www.oliveyoung.com.tw/",
                merchant: {
                  name: "OLIVE YOUNG",
                  logo: "https://dealy.hk/wp-content/uploads/2025/07/oliveyoung.png"
                }
              }}
              onGetCode={handleGetCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponsDemo;
