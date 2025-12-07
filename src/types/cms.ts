// /projects/dealy-tw-frontend/src/types/cms.ts
import { z } from "zod";

// Strapi Image/Media Schema
export const ImageZ = z.object({
  url: z.string(),
  alternativeText: z.string().nullable().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

// Strapi Shop/Merchant Schema
export const ShopZ = z.object({
  id: z.number(),
  attributes: z.object({
    merchant_name: z.string(),
    slug: z.string(),
    summary: z.string().nullable().optional(),
    store_description: z.string().nullable().optional(),
    site_url: z.string().nullable().optional(),
    default_affiliate_link: z.string().nullable().optional(),
    logo: z.object({ 
      data: z.object({ 
        attributes: ImageZ 
      }).nullable() 
    }).nullable().optional(),
    pageLayout: z.enum(["coupon", "blog"]).optional(),
    is_featured: z.boolean().optional(),
    market: z.object({
      data: z.object({
        id: z.number(),
        attributes: z.object({
          name: z.string(),
          key: z.string(),
          defaultLocale: z.enum(["zh-Hant-HK", "zh-Hant-TW"]).optional(),
        })
      }).nullable()
    }).nullable().optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    canonical_url: z.string().nullable().optional(),
    priority: z.number().optional(),
    robots: z.string().optional(),
    category: z.object({
      data: z.object({
        id: z.number(),
        attributes: z.object({
          name: z.string(),
          slug: z.string(),
        })
      }).nullable()
    }).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string().nullable().optional(),
  }),
});

// Strapi Coupon Schema
export const CouponZ = z.object({
  id: z.number(),
  attributes: z.object({
    coupon_title: z.string(),
    coupon_uid: z.string(),
    merchant: z.object({ data: ShopZ.nullable() }).nullable(),
    value: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    coupon_type: z.enum(["promo_code", "coupon", "discount"]),
    affiliate_link: z.string(),
    description: z.string().nullable().optional(),
    editor_tips: z.string().nullable().optional(),
    priority: z.number().optional(),
    starts_at: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    coupon_status: z.enum(["active", "expired", "scheduled", "archived"]),
    user_count: z.number().optional(),
    last_click_at: z.string().nullable().optional(),
    display_count: z.number().optional(),
    market: z.object({
      data: z.object({
        id: z.number(),
        attributes: z.object({
          name: z.string(),
          key: z.string(),
          defaultLocale: z.enum(["zh-Hant-HK", "zh-Hant-TW"]).optional(),
        })
      }).nullable()
    }).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string().nullable().optional(),
  }),
});

// Strapi Topic Schema
export const TopicZ = z.object({
  id: z.number(),
  attributes: z.object({
    title: z.string(),
    slug: z.string(),
    intro: z.string().nullable().optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    featured_merchants: z.array(z.object({
      id: z.number(),
      merchant: z.object({ data: ShopZ.nullable() }).nullable(),
    })).optional(),
    flash_deals: z.array(z.object({
      id: z.number(),
      coupon: z.object({ data: CouponZ.nullable() }).nullable(),
    })).optional(),
    market: z.object({
      data: z.object({
        id: z.number(),
        attributes: z.object({
          name: z.string(),
          key: z.string(),
          defaultLocale: z.enum(["zh-Hant-HK", "zh-Hant-TW"]).optional(),
        })
      }).nullable()
    }).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string().nullable().optional(),
  }),
});

// Homepage Component Schemas
export const HomeHeroZ = z.object({
  id: z.number(),
  background: z.object({
    data: z.object({
      attributes: ImageZ
    }).nullable()
  }).nullable().optional(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  showSearch: z.boolean().optional(),
});

export const HomeStoreSectionZ = z.object({
  id: z.number(),
  heading: z.string(),
  merchants: z.object({
    data: z.array(ShopZ)
  }).nullable().optional(),
});

export const HomeCategorySectionZ = z.object({
  id: z.number(),
  heading: z.string(),
  merchants: z.object({
    data: z.array(ShopZ)
  }).nullable().optional(),
  categories: z.object({
    data: z.array(z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        slug: z.string(),
      })
    }))
  }).nullable().optional(),
});

export const HomeCouponSectionZ = z.object({
  id: z.number(),
  heading: z.string(),
  merchants: z.object({
    data: z.array(ShopZ)
  }).nullable().optional(),
});

export const HomeTopicSectionZ = z.object({
  id: z.number(),
  heading: z.string(),
  topics: z.object({
    data: z.array(TopicZ)
  }).nullable().optional(),
});

// Homepage Schema
export const HomePageZ = z.object({
  id: z.number(),
  attributes: z.object({
    title: z.string(),
    hero: z.array(HomeHeroZ).optional(),
    popularstore: HomeStoreSectionZ.nullable().optional(),
    category: HomeCategorySectionZ.nullable().optional(),
    coupon: HomeCouponSectionZ.nullable().optional(),
    topicpage: HomeTopicSectionZ.nullable().optional(),
    seo_title: z.string().nullable().optional(),
    seo_description: z.string().nullable().optional(),
    market: z.object({
      data: z.object({
        id: z.number(),
        attributes: z.object({
          name: z.string(),
          key: z.string(),
          defaultLocale: z.enum(["zh-Hant-HK", "zh-Hant-TW"]).optional(),
        })
      }).nullable()
    }).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string().nullable().optional(),
  }),
});

// Strapi Response Wrappers
export const StrapiResponseZ = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        pageCount: z.number(),
        total: z.number(),
      }).optional(),
    }).optional(),
  });

export const StrapiCollectionResponseZ = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: z.object({
      pagination: z.object({
        page: z.number(),
        pageSize: z.number(),
        pageCount: z.number(),
        total: z.number(),
      }),
    }),
  });

// Type exports
export type Image = z.infer<typeof ImageZ>;
export type Shop = z.infer<typeof ShopZ>;
export type Coupon = z.infer<typeof CouponZ>;
export type Topic = z.infer<typeof TopicZ>;
export type HomePage = z.infer<typeof HomePageZ>;
export type HomeHero = z.infer<typeof HomeHeroZ>;
export type HomeStoreSection = z.infer<typeof HomeStoreSectionZ>;
export type HomeCategorySection = z.infer<typeof HomeCategorySectionZ>;
export type HomeCouponSection = z.infer<typeof HomeCouponSectionZ>;
export type HomeTopicSection = z.infer<typeof HomeTopicSectionZ>;

// Strapi Response Types
export type StrapiResponse<T> = {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type StrapiCollectionResponse<T> = {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

// Helper types for transformed data
export type TransformedShop = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  store_description?: string;
  website: string | null;
  affiliateLink: string | null;
  pageLayout: "coupon" | "blog";
  isFeatured: boolean;
  market: {
    id: number;
    name: string;
    key: string;
    defaultLocale?: "zh-Hant-HK" | "zh-Hant-TW";
  } | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  priority: number;
  robots: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  relatedMerchants?: Array<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    firstCoupon: {
      id: string;
      title: string;
      value: string;
      code?: string;
      coupon_type: string;
      affiliate_link: string;
      priority: number;
    } | null;
  }>;
  faqs?: any; // Raw rich text blocks from CMS, same as store_description
  how_to?: any; // Raw rich text blocks for how-to section
  useful_links?: Array<{
    id: string;
    link_title: string;
    url: string;
  }>; // Component field with link_title and url
  location_filtering?: boolean;
  creditcard_filtering?: boolean;
  page_title_h1?: string | null;
  h1Title?: string; // Pre-generated H1 title from server
  lastUpdatedDate?: string; // Pre-formatted date from server
  lastUpdatedDateISO?: string; // ISO date string for <time datetime>
};

export type TransformedCoupon = {
  id: number;
  title: string;
  slug: string;
  type: "promo_code" | "coupon" | "discount";
  code: string | null;
  affiliateLink: string;
  startDate: string | null;
  expiryDate: string | null;
  description: string | null;
  editorTips: string | null;
  discountValue: string | null;
  priority: number;
  status: "active" | "expired" | "scheduled" | "archived";
  usageCount: number;
  lastClickAt: string | null;
  displayCount: number;
  merchant: TransformedShop | null;
  market: {
    id: number;
    name: string;
    key: string;
    defaultLocale?: "zh-Hant-HK" | "zh-Hant-TW";
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type TransformedTopic = {
  id: number;
  title: string;
  slug: string;
  intro: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredMerchants: Array<{
    id: number;
    merchant: TransformedShop | null;
  }>;
  flashDeals: Array<{
    id: number;
    coupon: TransformedCoupon | null;
  }>;
  market: {
    id: number;
    name: string;
    key: string;
    defaultLocale?: "zh-Hant-HK" | "zh-Hant-TW";
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type TransformedHomePage = {
  id: number;
  title: string;
  hero: Array<{
    id: number;
    backgroundImage: string | null;
    title: string;
    subtitle: string | null;
    showSearch: boolean;
  }>;
  featuredStores: {
    id: number;
    heading: string;
    merchants: TransformedShop[];
  } | null;
  categorySection: {
    id: number;
    heading: string;
    merchants: TransformedShop[];
    categories: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  } | null;
  couponSection: {
    id: number;
    heading: string;
    merchants: TransformedShop[];
  } | null;
  topicSection: {
    id: number;
    heading: string;
    topics: TransformedTopic[];
  } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  market: {
    id: number;
    name: string;
    key: string;
    defaultLocale?: "zh-Hant-HK" | "zh-Hant-TW";
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};
