import { mediaFrom } from "./media";

export function mapHero(rawHero: any) {
  const h = Array.isArray(rawHero) ? rawHero[0] : rawHero; // supports repeatable/non-repeatable
  return {
    bgUrl: mediaFrom(h?.background),         // <-- absolute URL
    title: h?.title ?? "",
    subtitle: h?.subtitle ?? "",
    description: h?.description ?? "",
    searchPlaceholder: h?.search_placeholder ?? "",
    showSearch: Boolean(h?.showSearch),
  };
}

export function mapMerchantBasic(m: any) {
  return {
    id: m.id,
    name: m.attributes?.name || m.name,
    slug: m.attributes?.slug || m.slug,
    logoUrl: mediaFrom(m.attributes?.logo || m.logo),    // <-- absolute URL
    description: (m.attributes?.description || m.description) ?? "",
    topCouponTitle: m.coupons?.data?.[0]?.coupon_title || ""
  };
}

export function mapCategoryBasic(c: any) {
  return {
    id: c.id,
    name: c.attributes?.name || c.name,
    slug: c.attributes?.slug || c.slug,
    iconUrl: mediaFrom(c.attributes?.icon || c.icon),    // <-- absolute URL
  };
}

export function mapCouponFromMerchant(m: any) {
  const c = m.attributes?.coupons?.data?.[0]?.attributes || m.coupons?.data?.[0];
  if (!c) return null;
  return {
    shop: {
      id: m.id,
      name: m.attributes?.name || m.name,
      slug: m.attributes?.slug || m.slug,
      logoUrl: mediaFrom(m.attributes?.logo || m.logo),  // <-- absolute URL
    },
    coupon: {
      title: c.coupon_title,
      couponType: c.coupon_type, // 'promo_code' | 'coupon' | 'auto_discount'
      code: c.code ?? "",
      affiliateLink: c.affiliate_link ?? "#",
      expiresAt: c.expires_at ?? null,
      usageCount: c.user_count ?? 0,
      description: c.description ?? "",
      terms: c.editor_tips ?? "",
    },
  };
}
