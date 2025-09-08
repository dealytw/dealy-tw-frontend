// /projects/dealy-tw-frontend/src/lib/types.ts
import { z } from "zod";

// Strapi Media Schema
export const StrapiMediaSchema = z.object({
  id: z.number(),
  name: z.string(),
  alternativeText: z.string().nullable(),
  caption: z.string().nullable(),
  width: z.number(),
  height: z.number(),
  formats: z.record(z.any()).nullable(),
  hash: z.string(),
  ext: z.string(),
  mime: z.string(),
  size: z.number(),
  url: z.string(),
  previewUrl: z.string().nullable(),
  provider: z.string(),
  provider_metadata: z.record(z.any()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Merchant Schema
export const MerchantSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  logo: StrapiMediaSchema.nullable(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  affiliateLink: z.string().nullable(),
  pageLayout: z.enum(["coupon", "blog"]).default("coupon"),
  isFeatured: z.boolean().default(false),
  market: z.string().default("HK"),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  priority: z.number().default(0),
  robots: z.string().default("index,follow"),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});

// Coupon Schema
export const CouponSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  code: z.string().nullable(),
  discount: z.string().nullable(),
  discountValue: z.number().nullable(),
  expiry: z.string().nullable(),
  usageCount: z.number().default(0),
  merchant: MerchantSchema.nullable(),
  affiliateLink: z.string().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});

// Topic Schema
export const TopicSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  merchants: z.array(MerchantSchema).default([]),
  coupons: z.array(CouponSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});

// Strapi Response Schemas
export const StrapiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
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

export const StrapiCollectionResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
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
export type StrapiMedia = z.infer<typeof StrapiMediaSchema>;
export type Merchant = z.infer<typeof MerchantSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type Topic = z.infer<typeof TopicSchema>;
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
