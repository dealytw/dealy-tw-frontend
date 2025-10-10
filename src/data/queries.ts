// /projects/dealy-tw-frontend/src/data/queries.ts
// Temporarily commented out to fix build errors
/*
import { strapi } from "@/lib/strapi";
import {
  Shop,
  Coupon,
  Topic,
  HomePage,
  StrapiCollectionResponse,
  ShopZ,
  CouponZ,
  TopicZ,
  HomePageZ,
  StrapiCollectionResponseZ,
  TransformedShop,
  TransformedCoupon,
  TransformedTopic,
  TransformedHomePage,
} from "@/types/cms";
import {
  transformShop,
  transformCoupon,
  transformTopic,
  transformHomePage,
  transformShops,
  transformCoupons,
  transformTopics,
} from "@/lib/transformers";

// Home: homepage data with market filtering
export async function getHome({ 
  marketKey = "HK", 
  draft = false 
}: { 
  marketKey?: string;
  draft?: boolean 
} = {}) {
  // Get homepage data for specific market
  const homepageResponse = await strapi<StrapiCollectionResponse<HomePage>>("/api/home-pages", {
    query: {
      filters: {
        market: {
          key: { $eq: marketKey }
        }
      },
      populate: {
        hero: {
          populate: {
            background: { populate: "*" }
          }
        },
        popularstore: {
          populate: {
            merchants: {
              populate: {
                logo: { populate: "*" },
                market: { populate: "*" },
                category: { populate: "*" }
              }
            }
          }
        },
        category: {
          populate: {
            merchants: {
              populate: {
                logo: { populate: "*" },
                market: { populate: "*" },
                category: { populate: "*" }
              }
            },
            categories: { populate: "*" }
          }
        },
        coupon: {
          populate: {
            merchants: {
              populate: {
                logo: { populate: "*" },
                market: { populate: "*" },
                category: { populate: "*" }
              }
            }
          }
        },
        topicpage: {
          populate: {
            topics: {
              populate: {
                featured_merchants: {
                  populate: {
                    merchant: {
                      populate: {
                        logo: { populate: "*" },
                        market: { populate: "*" },
                        category: { populate: "*" }
                      }
                    }
                  }
                },
                flash_deals: {
                  populate: {
                    coupon: {
                      populate: {
                        merchant: {
                          populate: {
                            logo: { populate: "*" },
                            market: { populate: "*" },
                            category: { populate: "*" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        market: { populate: "*" }
      }
    },
    tags: [`homepage:${marketKey}`],
    draft,
  });

  const validatedHomepage = StrapiCollectionResponseZ(HomePageZ).parse(homepageResponse);
  const homepage = validatedHomepage.data[0];
  
  if (!homepage) {
    throw new Error(`Homepage not found for market: ${marketKey}`);
  }

  return transformHomePage(homepage);
}

// Get shop/merchant by slug
export async function getShopBySlug(slug: string, opts?: { draft?: boolean }) {
  const data = await strapi<StrapiCollectionResponse<Shop>>("/api/merchants", {
    query: {
      filters: { slug: { $eq: slug } },
      populate: { 
        logo: { populate: "*" }, 
        seo: { populate: "*" } 
      },
    },
    tags: [`shop:${slug}`],
    draft: opts?.draft,
  });

  const validatedData = StrapiCollectionResponseZ(ShopZ).parse(data);
  const shop = validatedData.data[0];
  return shop ? transformShop(shop) : null;
}

// Get coupons for a specific shop
export async function getCouponsForShop(shopId: number, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query: {
      filters: { merchant: { id: { $eq: shopId } } },
      sort: ["priority:asc", "createdAt:desc"],
      pagination: { pageSize: 48 },
      populate: { 
        merchant: { 
          populate: { 
            logo: { populate: "*" },
            market: { populate: "*" },
            category: { populate: "*" }
          } 
        } 
      },
    },
    tags: [`coupons:shop:${shopId}`],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(response);
  return transformCoupons(validatedResponse.data);
}

// Get first coupon from a merchant (for homepage coupon section)
export async function getFirstCouponForMerchant(merchantSlug: string, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query: {
      filters: { 
        merchant: { slug: { $eq: merchantSlug } },
        coupon_status: { $eq: "active" }
      },
      sort: ["priority:asc", "createdAt:desc"],
      pagination: { pageSize: 1 },
      populate: { 
        merchant: { 
          populate: { 
            logo: { populate: "*" },
            market: { populate: "*" },
            category: { populate: "*" }
          } 
        } 
      },
    },
    tags: [`coupon:merchant:${merchantSlug}:first`],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(response);
  const coupon = validatedResponse.data[0];
  return coupon ? transformCoupon(coupon) : null;
}

// Get all coupons with filters
export async function getCoupons(params?: {
  shopSlug?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
  draft?: boolean;
}) {
  const query: any = {
    populate: {
      shop: { populate: { logo: { populate: "*" } } },
    },
    sort: ["createdAt:desc"],
  };

  if (params?.shopSlug) {
    query.filters = { 
      ...query.filters, 
      shop: { slug: { $eq: params.shopSlug } } 
    };
  }

  if (params?.active !== undefined) {
    query.filters = { 
      ...query.filters, 
      is_active: { $eq: params.active } 
    };
  }

  if (params?.limit) {
    query.pagination = { ...query.pagination, pageSize: params.limit };
  }

  if (params?.offset) {
    query.pagination = { ...query.pagination, start: params.offset };
  }

  const response = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query,
    tags: ["coupon:list"],
    draft: params?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(response);
  return transformCoupons(validatedResponse.data);
}

// Get all shops/merchants with filters
export async function getShops(params?: {
  featured?: boolean;
  market?: string;
  limit?: number;
  offset?: number;
  draft?: boolean;
}) {
  const query: any = {
    populate: { logo: { populate: "*" } },
    sort: ["priority:asc", "merchant_name:asc"],
  };

  if (params?.featured !== undefined) {
    query.filters = { 
      ...query.filters, 
      is_featured: { $eq: params.featured } 
    };
  }

  if (params?.market) {
    query.filters = { 
      ...query.filters, 
      market: { $eq: params.market } 
    };
  }

  if (params?.limit) {
    query.pagination = { ...query.pagination, pageSize: params.limit };
  }

  if (params?.offset) {
    query.pagination = { ...query.pagination, start: params.offset };
  }

  const response = await strapi<StrapiCollectionResponse<Shop>>("/api/merchants", {
    query,
    tags: ["shop:list"],
    draft: params?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(ShopZ).parse(response);
  return transformShops(validatedResponse.data);
}

// Get topics with merchants and coupons
export async function getTopics(params?: {
  limit?: number;
  offset?: number;
  draft?: boolean;
}) {
  const query: any = {
    populate: {
      merchants: { populate: { logo: { populate: "*" } } },
      coupons: {
        populate: {
          shop: { populate: { logo: { populate: "*" } } },
        },
      },
    },
  };

  if (params?.limit) {
    query.pagination = { ...query.pagination, pageSize: params.limit };
  }

  if (params?.offset) {
    query.pagination = { ...query.pagination, start: params.offset };
  }

  const response = await strapi<StrapiCollectionResponse<Topic>>("/api/topics", {
    query,
    tags: ["topic:list"],
    draft: params?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(TopicZ).parse(response);
  return transformTopics(validatedResponse.data);
}

// Get topic by slug
export async function getTopicBySlug(slug: string, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Topic>>("/api/topics", {
    query: {
      filters: { slug: { $eq: slug } },
      populate: {
        merchants: { populate: { logo: { populate: "*" } } },
        coupons: {
          populate: {
            shop: { populate: { logo: { populate: "*" } } },
          },
        },
      },
    },
    tags: [`topic:${slug}`],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(TopicZ).parse(response);
  const topic = validatedResponse.data[0];
  return topic ? transformTopic(topic) : null;
}

// Search functions
export async function searchShops(query: string, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Shop>>("/api/merchants", {
    query: {
      filters: {
        $or: [
          { merchant_name: { $containsi: query } },
          { summary: { $containsi: query } },
          { store_description: { $containsi: query } },
        ],
      },
      populate: { logo: { populate: "*" } },
    },
    tags: ["shop:search"],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(ShopZ).parse(response);
  return transformShops(validatedResponse.data);
}

export async function searchCoupons(query: string, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query: {
      filters: {
        $or: [
          { title: { $containsi: query } },
          { description: { $containsi: query } },
          { code: { $containsi: query } },
        ],
      },
      populate: {
        shop: { populate: { logo: { populate: "*" } } },
      },
    },
    tags: ["coupon:search"],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(response);
  return transformCoupons(validatedResponse.data);
}

// Slugs for SSG (Static Site Generation)
export async function getAllShopSlugs() {
  const res = await strapi<StrapiCollectionResponse<Shop>>("/api/merchants", {
    query: { 
      fields: ["slug"], 
      pagination: { pageSize: 500 } 
    },
    tags: ["shop:slugs"],
    revalidate: 3600,
  });

  const validatedResponse = StrapiCollectionResponseZ(ShopZ).parse(res);
  return validatedResponse.data.map((s) => s.attributes.slug);
}

export async function getAllTopicSlugs() {
  const res = await strapi<StrapiCollectionResponse<Topic>>("/api/topics", {
    query: { 
      fields: ["slug"], 
      pagination: { pageSize: 500 } 
    },
    tags: ["topic:slugs"],
    revalidate: 3600,
  });

  const validatedResponse = StrapiCollectionResponseZ(TopicZ).parse(res);
  return validatedResponse.data.map((t) => t.attributes.slug);
}

export async function getAllCouponSlugs() {
  const res = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query: { 
      fields: ["slug"], 
      pagination: { pageSize: 500 } 
    },
    tags: ["coupon:slugs"],
    revalidate: 3600,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(res);
  return validatedResponse.data.map((c) => c.attributes.slug);
}

// Single item queries
export async function getCouponBySlug(slug: string, opts?: { draft?: boolean }) {
  const response = await strapi<StrapiCollectionResponse<Coupon>>("/api/coupons", {
    query: {
      filters: { slug: { $eq: slug } },
      populate: {
        shop: { populate: { logo: { populate: "*" } } },
      },
    },
    tags: [`coupon:${slug}`],
    draft: opts?.draft,
  });

  const validatedResponse = StrapiCollectionResponseZ(CouponZ).parse(response);
  const coupon = validatedResponse.data[0];
  return coupon ? transformCoupon(coupon) : null;
}

// Revalidation helpers
export async function revalidateShop(slug: string) {
  // This would be called from API routes for on-demand revalidation
  const tags = [`shop:${slug}`, "shop:list", "shop:featured"];
  return tags;
}

export async function revalidateCoupons(shopId?: number) {
  const tags = ["coupon:list", "coupon:search"];
  if (shopId) {
    tags.push(`coupons:shop:${shopId}`);
  }
  return tags;
}
*/
