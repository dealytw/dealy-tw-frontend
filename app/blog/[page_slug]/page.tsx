import { notFound } from 'next/navigation';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import { pageMeta } from '@/seo/meta';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';
import BlogView from './blog-view';

/**
 * Blog Page Route - Step 1 (Basic Implementation)
 * 
 * FAILURE LOG (for future reference):
 * - Commit e2c0e43: Basic page works (no blog_sections populate)
 * - Commit 78753f1+: Adding blog_sections populate causes 404 "non-existent route" error
 * 
 * Failure Analysis:
 * - When blog_sections populate is added, Next.js route becomes unrecognized
 * - Error: "User attempted to access non-existent route: /blog/{page_slug}"
 * - Possible causes:
 *   1. Populate query syntax causes Strapi timeout/error that breaks route generation
 *   2. Deep nesting in populate causes build-time failure
 *   3. Route file structure issue when complex queries are present
 * 
 * Current Status: Reverted to working version (e2c0e43) without blog_sections populate
 * Next Steps: Add blog_sections populate incrementally with better error handling
 */

// Revalidate every 1 minute - temporarily for development/mapping work
// TODO: Change back to 86400 (24 hours) after development is complete
export const revalidate = 60;
export const dynamic = 'force-static'; // Force static ISR to ensure cacheable HTML

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ page_slug: string }> }) {
  const { page_slug } = await params;
  
  try {
    // Fetch blog with basic fields only (same pattern as merchant pages)
    const blogData = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      'filters[page_slug][$eq]': page_slug,
      'fields[0]': 'blog_title',
      'fields[1]': 'page_slug',
    })}`, {
      revalidate: 60, // 1 minute for development
      tag: `blog:${page_slug}`
    });
    
    const blog = blogData?.data?.[0];
    
    if (!blog) {
      return pageMeta({
        title: `${page_slug}｜部落格`,
        description: '文章內容',
        path: `/blog/${page_slug}`,
      });
    }

    // Extract blog_title - handle both Strapi v5 attributes format and flat format
    const title = blog.attributes?.blog_title || blog.blog_title || `${page_slug}｜部落格`;
    const description = title;

    return pageMeta({
      title,
      description,
      path: `/blog/${page_slug}`,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return pageMeta({
      title: `${page_slug}｜部落格`,
      description: '文章內容',
      path: `/blog/${page_slug}`,
    });
  }
}

interface BlogPageProps {
  params: Promise<{ page_slug: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { page_slug } = await params;

  // Get siteUrl early
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  try {
    // Use server-only Strapi fetch with ISR (same pattern as merchant pages)
    // Fetch blog_sections in main query (text fields only, like useful_links)
    // Media fields (blog_image) will be fetched separately to avoid route 404
    const blogRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      "filters[page_slug][$eq]": page_slug,
      "fields[0]": "id",
      "fields[1]": "blog_title",
      "fields[2]": "page_slug",
      "fields[3]": "createdAt",
      "fields[4]": "updatedAt",
      "populate[blog_sections][fields][0]": "h2_blog_section_title",  // Text field - no nested populate
      "populate[blog_sections][fields][1]": "blog_texts",  // Rich text - no nested populate
      // blog_table - all text fields (repeatable component)
      "populate[blog_table][fields][0]": "table_h3",
      "populate[blog_table][fields][1]": "table_title",
      "populate[blog_table][fields][2]": "table_description",
      "populate[blog_table][fields][3]": "table_promo_code",
      "populate[blog_table][fields][4]": "landingpage",
      "populate[blog_table][fields][5]": "table_date",
      // blog_coupon - relation to coupons (text fields first)
      "populate[blog_coupon][fields][0]": "id",
      "populate[blog_coupon][fields][1]": "coupon_title",
      "populate[blog_coupon][fields][2]": "value",
      "populate[blog_coupon][fields][3]": "code",
      "populate[blog_coupon][fields][4]": "affiliate_link",
      "populate[blog_coupon][fields][5]": "coupon_type",
      "populate[blog_coupon][fields][6]": "expires_at",
      "populate[blog_coupon][fields][7]": "priority",
      "populate[blog_coupon][fields][8]": "display_count",
      "populate[blog_coupon][fields][9]": "coupon_status",
      "populate[blog_coupon][fields][10]": "description",
      "populate[blog_coupon][fields][11]": "editor_tips",
      // blog_coupon nested relations (merchant with logo)
      "populate[blog_coupon][populate][merchant][fields][0]": "id",
      "populate[blog_coupon][populate][merchant][fields][1]": "merchant_name",
      "populate[blog_coupon][populate][merchant][fields][2]": "page_slug",
      "populate[blog_coupon][populate][merchant][populate][logo][fields][0]": "url",
      "populate[blog_coupon][populate][market][fields][0]": "key",
      "populate[related_merchants][fields][0]": "id",
      "populate[related_merchants][fields][1]": "merchant_name",
      "populate[related_merchants][fields][2]": "page_slug",
      "populate[related_merchants][populate][logo][fields][0]": "url",
      "populate[related_blogs][fields][0]": "id",
      "populate[related_blogs][fields][1]": "blog_title",
      "populate[related_blogs][fields][2]": "page_slug",
      "populate[related_blogs][fields][3]": "createdAt",
      "populate[related_blogs][fields][4]": "updatedAt",
    })}`, { 
      revalidate: 60, // 1 minute for development
      tag: `blog:${page_slug}` 
    });

    const blog = blogRes?.data?.[0];
    
    if (!blog) {
      console.error('Error fetching blog data:', blogRes);
      notFound();
    }

    // Fetch blog_image URLs separately (media fields need nested populate)
    // Only fetch if blog_sections exist
    const blogId = blog.id || blog.attributes?.id;
    let blogSections: any[] = blog.blog_sections || blog.attributes?.blog_sections || [];
    
    if (blogSections.length > 0 && blogId) {
      try {
        const imagesRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
          "filters[id][$eq]": blogId,
          "populate[blog_sections][populate][blog_image][fields][0]": "url",
        })}`, { 
          revalidate: 60,
          tag: `blog-images:${page_slug}` 
        });
        
        const blogWithImages = imagesRes?.data?.[0];
        if (blogWithImages) {
          const imagesData = blogWithImages.blog_sections || blogWithImages.attributes?.blog_sections || [];
          // Merge image URLs into existing sections
          blogSections = blogSections.map((section: any, index: number) => {
            const imageSection = imagesData[index];
            const imageData = imageSection?.blog_image?.data || imageSection?.blog_image;
            const imageUrl = imageData?.attributes?.url || imageData?.url;
            return {
              ...section,
              blog_image_url: imageUrl || null,
            };
          });
        }
      } catch (imagesError) {
        console.error('Error fetching blog_image URLs:', imagesError);
        // Continue without images rather than failing the page
      }
    }

    // Extract blog data - handle both Strapi v5 attributes format and flat format (same pattern as merchant pages)
    const blogData = {
      id: blog.id || blog.attributes?.id,
      blog_title: blog.attributes?.blog_title || blog.blog_title,
      page_slug: blog.attributes?.page_slug || blog.page_slug || page_slug,
      createdAt: blog.attributes?.createdAt || blog.createdAt,
      updatedAt: blog.attributes?.updatedAt || blog.updatedAt,
      blog_sections: blogSections, // Use separately fetched sections
      blog_table: blog.blog_table || blog.attributes?.blog_table,
      blog_coupon: blog.blog_coupon || blog.attributes?.blog_coupon,
      related_merchants: blog.related_merchants || blog.attributes?.related_merchants,
      related_blogs: blog.related_blogs || blog.attributes?.related_blogs,
    };

    // Extract related merchants - handle all possible formats for manyToMany relation (same pattern as merchant pages)
    let relatedMerchants: any[] = [];
    if (blogData.related_merchants) {
      // Handle all possible formats:
      // 1. Direct array: [{ id, ... }]
      // 2. With data wrapper: { data: [{ id, ... }] }
      // 3. Nested: [{ data: { id, ... } }]
      let relatedFromCMS = [];
      if (Array.isArray(blogData.related_merchants)) {
        // Check if it's nested format
        if (blogData.related_merchants[0]?.data) {
          relatedFromCMS = blogData.related_merchants.map((item: any) => item.data || item);
        } else {
          relatedFromCMS = blogData.related_merchants;
        }
      } else if (blogData.related_merchants?.data) {
        relatedFromCMS = blogData.related_merchants.data;
      }
      
      relatedMerchants = relatedFromCMS.map((merchant: any) => {
        const merchantId = merchant.id || merchant.attributes?.id;
        const merchantName = merchant.merchant_name || merchant.attributes?.merchant_name || '';
        const merchantSlug = merchant.page_slug || merchant.attributes?.page_slug || '';
        const logoUrl = merchant.logo?.url || merchant.logo?.attributes?.url || merchant.attributes?.logo?.url;
        
        return {
          id: merchantId,
          name: merchantName,
          slug: merchantSlug,
          logo: logoUrl ? absolutizeMedia(logoUrl) : null,
        };
      });
    }

    // Extract related blogs - handle all possible formats (same pattern as merchant pages)
    let relatedBlogs: any[] = [];
    if (blogData.related_blogs) {
      let relatedFromCMS = [];
      if (Array.isArray(blogData.related_blogs)) {
        if (blogData.related_blogs[0]?.data) {
          relatedFromCMS = blogData.related_blogs.map((item: any) => item.data || item);
        } else {
          relatedFromCMS = blogData.related_blogs;
        }
      } else if (blogData.related_blogs?.data) {
        relatedFromCMS = blogData.related_blogs.data;
      }
      
      relatedBlogs = relatedFromCMS.map((relatedBlog: any) => ({
        id: relatedBlog.id || relatedBlog.attributes?.id,
        title: relatedBlog.blog_title || relatedBlog.attributes?.blog_title || '',
        slug: relatedBlog.page_slug || relatedBlog.attributes?.page_slug || '',
        createdAt: relatedBlog.createdAt || relatedBlog.attributes?.createdAt || '',
        updatedAt: relatedBlog.updatedAt || relatedBlog.attributes?.updatedAt || '',
        thumbnail: null,
      }));
    }

    // Extract blog_table - handle repeatable component format (same pattern as blog_sections)
    let blogTable: any[] = [];
    if (blogData.blog_table) {
      const tableData = Array.isArray(blogData.blog_table) 
        ? blogData.blog_table 
        : (blogData.blog_table?.data || []);
      
      blogTable = tableData.map((table: any) => {
        const tableItem = table.attributes || table;
        return {
          id: tableItem.id || table.id || 0,
          table_h3: tableItem.table_h3 || '',
          table_title: tableItem.table_title || '',
          table_description: tableItem.table_description || '',
          table_promo_code: tableItem.table_promo_code || '',
          landingpage: tableItem.landingpage || '',
          table_date: tableItem.table_date || '',
        };
      });
    }

    // Extract blog_coupon - handle relation format (same pattern as related_merchants)
    let blogCoupons: any[] = [];
    if (blogData.blog_coupon) {
      let couponsFromCMS = [];
      if (Array.isArray(blogData.blog_coupon)) {
        if (blogData.blog_coupon[0]?.data) {
          couponsFromCMS = blogData.blog_coupon.map((item: any) => item.data || item);
        } else {
          couponsFromCMS = blogData.blog_coupon;
        }
      } else if (blogData.blog_coupon?.data) {
        couponsFromCMS = blogData.blog_coupon.data;
      }
      
      blogCoupons = couponsFromCMS.map((coupon: any) => {
        const couponData = coupon.attributes || coupon;
        const merchantData = couponData.merchant?.data || couponData.merchant;
        const merchant = merchantData?.attributes || merchantData;
        const logoUrl = merchant?.logo?.url || merchant?.logo?.attributes?.url || merchant?.attributes?.logo?.url;
        
        return {
          id: couponData.id || coupon.id,
          coupon_title: couponData.coupon_title || '',
          value: couponData.value || '',
          code: couponData.code || '',
          affiliate_link: couponData.affiliate_link || '',
          coupon_type: couponData.coupon_type || '',
          expires_at: couponData.expires_at || '',
          priority: couponData.priority || 0,
          display_count: couponData.display_count || 0,
          coupon_status: couponData.coupon_status || 'active',
          description: couponData.description || [],
          editor_tips: couponData.editor_tips || [],
          merchant: merchant ? {
            id: merchant.id || merchantData.id,
            name: merchant.merchant_name || merchantData.merchant_name || '',
            slug: merchant.page_slug || merchantData.page_slug || '',
            logo: logoUrl ? absolutizeMedia(logoUrl) : null,
          } : null,
          market: couponData.market?.key || couponData.market?.attributes?.key || null,
        };
      });
    }

    const transformedBlog = {
      id: blogData.id,
      // CMS Field Mapping: blog_title -> title (mapped from /api/blogs collection)
      title: blogData.blog_title || 'Untitled Post',
      page_slug: blogData.page_slug,
      createdAt: blogData.createdAt || new Date().toISOString(),
      updatedAt: blogData.updatedAt || new Date().toISOString(),
      sections: (blogData.blog_sections || []).map((section: any) => {
        // Handle both Strapi v5 attributes format and flat format
        const sectionData = section.attributes || section;
        // Use blog_image_url from separate fetch, or try to get from section data
        const imageUrl = section.blog_image_url || sectionData.blog_image?.data?.attributes?.url || sectionData.blog_image?.attributes?.url || sectionData.blog_image?.url;
        
        return {
          id: sectionData.id || section.id || 0,
          h2_title: sectionData.h2_blog_section_title || '',
          banner_image: imageUrl ? absolutizeMedia(imageUrl) : '',
          blog_texts: sectionData.blog_texts || [], // Rich text JSON
        };
      }),
      blog_table: blogTable,
      blog_coupons: blogCoupons,
      related_merchants: relatedMerchants,
      related_blogs: relatedBlogs,
    };

    // Build breadcrumb JSON-LD
    const blogPostUrl = `${siteUrl}/blog/${page_slug}`;
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '部落格', url: `${siteUrl}/blog` },
      { name: transformedBlog.title, url: blogPostUrl },
    ]);

    return (
      <>
        <BlogView blog={transformedBlog} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
    );

  } catch (error) {
    console.error('Error fetching blog data:', error);
    notFound();
  }
}
