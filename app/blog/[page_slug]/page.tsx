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
// Changed to force-dynamic to test if static generation is causing 404
// Repeatable components with nested populate may timeout during build-time static generation
// force-dynamic renders on-demand, avoiding build-time route generation issues
export const dynamic = 'force-dynamic'; // Test: Render on-demand instead of static generation

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
      // Step 1: Add blog_sections text fields only (works in main query)
      "populate[blog_sections][fields][0]": "h2_blog_section_title",
      "populate[blog_sections][fields][1]": "blog_texts",
      "populate[blog_sections][fields][2]": "table_h3",
      "populate[blog_sections][fields][3]": "blog_texts_second",
      // Step 2: blog_table will be fetched separately (causes 404 even when alone in main query)
    })}`, { 
      revalidate: 60, // 1 minute for development
      tag: `blog:${page_slug}` 
    });

    const blog = blogRes?.data?.[0];
    
    if (!blog) {
      console.error('Error fetching blog data:', blogRes);
      notFound();
    }

    // Step 2: Fetch blog_table from within blog_sections (blog_table is nested inside blog_sections, not at blog level)
    // Each section can have its own blog_table array
    const blogId = blog.id || blog.attributes?.id;
    let sectionsWithTables: any[] = [];
    let sectionsWithCoupons: any[] = [];
    let sectionsWithImages: any[] = [];
    
    if (blogId) {
      try {
        // blog_table is nested inside blog_sections, so we need nested populate
        const queryString = qs({
          "filters[id][$eq]": blogId,
          "populate[blog_sections][populate][blog_table]": "*",  // Nested populate: blog_sections -> blog_table
        });
        const fetchUrl = `/api/blogs?${queryString}`;
        console.log('[BLOG_TABLE_FETCH] Fetch URL:', fetchUrl);
        
        const tableRes = await strapiFetch<{ data: any[] }>(fetchUrl, { 
          revalidate: 60,
          tag: `blog-table:${page_slug}` 
        });
        
        const blogWithTables = tableRes?.data?.[0];
        if (blogWithTables) {
          sectionsWithTables = blogWithTables.blog_sections || blogWithTables.attributes?.blog_sections || [];
          console.log('[BLOG_TABLE_FETCH] Found sections with tables:', sectionsWithTables.length);
        }
      } catch (tableError) {
        console.error('[BLOG_TABLE_FETCH] Error fetching blog_table:', tableError);
        // Continue without table rather than failing the page
      }
    }

    // Step 2.5: Fetch blog_images (media) from within blog_sections
    // Keep separate to avoid nested media populate causing route/Strapi issues.
    if (blogId) {
      try {
        const queryString = qs({
          "filters[id][$eq]": blogId,
          // Media: only request url (avoid `*` which can expand invalid keys like `.related`)
          "populate[blog_sections][populate][blog_images][fields][0]": "url",
        });
        const fetchUrl = `/api/blogs?${queryString}`;
        console.log('[BLOG_IMAGES_FETCH] Fetch URL:', fetchUrl);

        const imageRes = await strapiFetch<{ data: any[] }>(fetchUrl, {
          revalidate: 60,
          tag: `blog-images:${page_slug}`,
        });

        const blogWithImages = imageRes?.data?.[0];
        if (blogWithImages) {
          sectionsWithImages = blogWithImages.blog_sections || blogWithImages.attributes?.blog_sections || [];
          console.log('[BLOG_IMAGES_FETCH] Found sections with images:', sectionsWithImages.length);
        }
      } catch (imageError) {
        console.error('[BLOG_IMAGES_FETCH] Error fetching blog_images:', imageError);
        // Continue without images rather than failing the page
      }
    }

    // Step 3: Fetch blog_coupon separately (nested inside blog_sections)
    // blog_sections.blog_coupon is a repeatable component:
    // blog_sections[] -> blog_coupon[] -> { coupons (relation), coupon_image (media) }
    if (blogId) {
      try {
        const couponQuery = qs({
          "filters[id][$eq]": blogId,
          // IMPORTANT (Strapi v5):
          // Do NOT use `*` for media here. It can expand into invalid keys like `coupon_image.related`.
          // Fetch only the media fields we need (url), same style as homepage logo populates.
          "populate[blog_sections][populate][blog_coupon][populate][coupon_image][fields][0]": "url",

          // Coupons relation fields (text-only)
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][0]": "id",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][1]": "coupon_title",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][2]": "value",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][3]": "code",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][4]": "affiliate_link",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][5]": "coupon_type",
          "populate[blog_sections][populate][blog_coupon][populate][coupons][fields][6]": "expires_at",
        });

        const fetchUrl = `/api/blogs?${couponQuery}`;
        console.log('[BLOG_COUPON_FETCH] Fetch URL:', fetchUrl);

        const couponRes = await strapiFetch<{ data: any[] }>(fetchUrl, {
          revalidate: 60,
          tag: `blog-coupon:${page_slug}`,
        });

        const blogWithCoupons = couponRes?.data?.[0];
        const sections =
          blogWithCoupons?.blog_sections ||
          blogWithCoupons?.attributes?.blog_sections ||
          [];
        sectionsWithCoupons = Array.isArray(sections) ? sections : [];
        console.log('[BLOG_COUPON_FETCH] Found sections with coupons:', sectionsWithCoupons.length);
      } catch (couponError) {
        console.error('[BLOG_COUPON_FETCH] Error fetching blog_coupon:', couponError);
        // Continue without coupons rather than failing the page
      }
    }

    // Extract blog data - handle both Strapi v5 attributes format and flat format (same pattern as merchant pages)
    const blogData = {
      id: blog.id || blog.attributes?.id,
      blog_title: blog.attributes?.blog_title || blog.blog_title,
      page_slug: blog.attributes?.page_slug || blog.page_slug || page_slug,
      createdAt: blog.attributes?.createdAt || blog.createdAt,
      updatedAt: blog.attributes?.updatedAt || blog.updatedAt,
      blog_sections: blog.blog_sections || blog.attributes?.blog_sections,
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

    // blog_table is already fetched separately above (Step 2)

    // We'll merge coupons into each section by index (same approach as blog_table)
    const mapCouponBlocks = (sectionWithCoupons: any) => {
      const secData = sectionWithCoupons?.attributes || sectionWithCoupons;
      const blocksRaw = secData?.blog_coupon || secData?.blog_coupon?.data || [];
      const blocksArr = Array.isArray(blocksRaw) ? blocksRaw : (blocksRaw?.data || []);

      return blocksArr.map((block: any) => {
        const blockData = block?.attributes || block;
        const imgUrl =
          blockData?.coupon_image?.url ||
          blockData?.coupon_image?.attributes?.url ||
          blockData?.coupon_image?.data?.attributes?.url ||
          blockData?.coupon_image?.data?.url;

        const couponsRaw = blockData?.coupons?.data || blockData?.coupons || [];
        const couponsArr = Array.isArray(couponsRaw) ? couponsRaw : [];

        const coupons = couponsArr.map((c: any) => {
          const cd = c?.attributes || c;
          return {
            id: (cd?.id || c?.id || '').toString(),
            coupon_title: cd?.coupon_title || '',
            value: cd?.value || '',
            code: cd?.code || '',
            affiliate_link: cd?.affiliate_link || '',
            coupon_type: cd?.coupon_type || (cd?.code ? 'promo_code' : 'coupon'),
            expires_at: cd?.expires_at || '',
          };
        }).filter((c: any) => c.id && (c.coupon_title || c.value || c.affiliate_link));

        return {
          coupon_image: imgUrl ? absolutizeMedia(imgUrl) : null,
          coupons,
        };
      }).filter((b: any) => b.coupons?.length > 0);
    };

    const transformedBlog = {
      id: blogData.id,
      // CMS Field Mapping: blog_title -> title (mapped from /api/blogs collection)
      title: blogData.blog_title || 'Untitled Post',
      page_slug: blogData.page_slug,
      createdAt: blogData.createdAt || new Date().toISOString(),
      updatedAt: blogData.updatedAt || new Date().toISOString(),
      sections: (blogData.blog_sections || []).map((section: any, index: number) => {
        // Handle both Strapi v5 attributes format and flat format
        const sectionData = section.attributes || section;
        
        // Merge blog_table from separate fetch (sectionsWithTables) if available
        // Match sections by index
        let sectionTable: any[] = [];
        if (sectionsWithTables.length > index) {
          const sectionWithTable = sectionsWithTables[index];
          const sectionWithTableData = sectionWithTable.attributes || sectionWithTable;
          const sectionTableData = sectionWithTableData.blog_table || [];
          sectionTable = Array.isArray(sectionTableData) ? sectionTableData : (sectionTableData?.data || []);
        }
        
        // Extract and transform blog_table
        const blogTable = sectionTable.map((table: any) => {
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

        // Merge blog_coupon from separate fetch (sectionsWithCoupons) if available
        let sectionCouponBlocks: any[] = [];
        if (sectionsWithCoupons.length > index) {
          sectionCouponBlocks = mapCouponBlocks(sectionsWithCoupons[index]);
        }

        // Merge blog_images from separate fetch (sectionsWithImages) if available
        // Use the first image as the section banner
        let bannerImageUrl: string | null = null;
        if (sectionsWithImages.length > index) {
          const sectionWithImage = sectionsWithImages[index];
          const sectionWithImageData = sectionWithImage.attributes || sectionWithImage;
          const imgs = sectionWithImageData.blog_images;
          const imgDataArr = Array.isArray(imgs) ? imgs : (imgs?.data || []);
          const first = imgDataArr?.[0];
          const firstData = first?.attributes || first?.data?.attributes || first?.data || first;
          const url = firstData?.url;
          if (url) bannerImageUrl = absolutizeMedia(url);
        }
        
        return {
          id: sectionData.id || section.id || 0,
          h2_title: sectionData.h2_blog_section_title || '',
          table_h3: sectionData.table_h3 || '', // Table title above the table
          banner_image: bannerImageUrl, // Section banner image (first blog_images url)
          blog_texts: sectionData.blog_texts || [], // Rich text JSON
          blog_texts_second: sectionData.blog_texts_second || [], // Rich text JSON (below table/coupon)
          blog_table: blogTable, // Each section has its own blog_table array
          blog_coupon_blocks: sectionCouponBlocks, // Each section can have coupon blocks
        };
      }),
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
