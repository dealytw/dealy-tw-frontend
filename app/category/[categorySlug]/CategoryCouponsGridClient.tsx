"use client";

import CategoryCouponCard from "@/components/CategoryCouponCard";

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiry: string;
  usageCount: number;
  affiliate_link?: string;
  coupon_type?: string;
  merchant: {
    name: string;
    logo: string;
    slug?: string;
  };
}

export default function CategoryCouponsGridClient({
  coupons,
  gridClassName,
}: {
  coupons: Coupon[];
  gridClassName: string;
}) {
  return (
    <div className={gridClassName}>
      {coupons.map((coupon) => (
        <CategoryCouponCard
          key={coupon.id}
          coupon={{
            id: coupon.id,
            title: coupon.title,
            code: coupon.code,
            discount: coupon.discount,
            coupon_type: coupon.coupon_type,
            affiliate_link: coupon.affiliate_link,
            merchant: {
              name: coupon.merchant.name,
              logo: coupon.merchant.logo,
              slug: coupon.merchant.slug,
            },
          }}
        />
      ))}
    </div>
  );
}

