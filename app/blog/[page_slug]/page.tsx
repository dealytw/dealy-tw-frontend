import { notFound } from 'next/navigation';
import { strapiFetch, absolutizeMedia, rewriteImageUrl, qs } from '@/lib/strapi.server';
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

// Revalidate once per day
export const revalidate = 2592000; // Revalidate every 30 days (1 month) - blog posts are very static
// Content page: use ISR via `export const revalidate` (do not force SSR)

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ page_slug: string }> }) {
  const { page_slug } = await params;
  
  // Get market key for filtering (same pattern as merchant pages)
  const marketKey = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    // Fetch blog with basic fields only (same pattern as merchant pages)
    const blogData = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      'filters[page_slug][$eq]': page_slug,
      'filters[market][key][$eq]': marketKey, // Filter by market (TW only)
      'fields[0]': 'blog_title',
      'fields[1]': 'page_slug',
    })}`, {
      revalidate: 2592000, // Cache for 30 days
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

  // Get market key for filtering (same pattern as merchant pages)
  const marketKey = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  // Get siteUrl early
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  try {
    // Use server-only Strapi fetch with ISR (same pattern as merchant pages)
    // Fetch blog_sections in main query (text fields only, like useful_links)
    // Media fields (blog_image) will be fetched separately to avoid route 404
    const blogRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      "filters[page_slug][$eq]": page_slug,
      "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
      "fields[0]": "id",
      "fields[1]": "blog_title",
      "fields[2]": "page_slug",
      "fields[3]": "createdAt",
      "fields[4]": "updatedAt",
      "fields[5]": "intro_text",
      // Step 1: Add blog_sections text fields only (works in main query)
      "populate[blog_sections][fields][0]": "h2_blog_section_title",
      "populate[blog_sections][fields][1]": "blog_texts",
      "populate[blog_sections][fields][2]": "table_h3",
      "populate[blog_sections][fields][3]": "blog_texts_second",
      "populate[blog_sections][fields][4]": "section_button_text",
      "populate[blog_sections][fields][5]": "section_button_link",
      "populate[blog_sections][fields][6]": "blog_header_row",
      "populate[blog_sections][fields][7]": "header_color",
      "populate[blog_sections][fields][8]": "hover_color",
      "populate[blog_sections][fields][9]": "border_color",
      // Populate images in rich text blocks (blog_texts and blog_texts_second)
      "populate[blog_sections][populate][blog_texts][populate][image][fields][0]": "url",
      "populate[blog_sections][populate][blog_texts][populate][image][fields][1]": "alternativeText",
      "populate[blog_sections][populate][blog_texts_second][populate][image][fields][0]": "url",
      "populate[blog_sections][populate][blog_texts_second][populate][image][fields][1]": "alternativeText",
      // Relations (basic fields only)
      "populate[related_merchants][fields][0]": "id",
      "populate[related_merchants][fields][1]": "merchant_name",
      "populate[related_merchants][fields][2]": "page_slug",
      // Logo is media: request only url (avoid `*`)
      "populate[related_merchants][populate][logo][fields][0]": "url",

      "populate[related_blogs][fields][0]": "id",
      "populate[related_blogs][fields][1]": "blog_title",
      "populate[related_blogs][fields][2]": "page_slug",
      "populate[related_blogs][fields][3]": "updatedAt",
      // Related blog thumbnail (media url only)
      "populate[related_blogs][populate][thumbnail][fields][0]": "url",
      // Categories (relation)
      "populate[categories][fields][0]": "id",
      "populate[categories][fields][1]": "name",
      "populate[categories][fields][2]": "page_slug",
      // Step 2: blog_table will be fetched separately (causes 404 even when alone in main query)
    })}`, { 
      revalidate: 2592000, // Cache for 30 days
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
        // blog_table and blog_content_table are nested inside blog_sections, so we need nested populate
        const queryString = qs({
          "filters[id][$eq]": blogId,
          "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
          "populate[blog_sections][populate][blog_table]": "*",  // Nested populate: blog_sections -> blog_table (backward compatibility)
          "populate[blog_sections][populate][blog_content_table]": "*",  // Nested populate: blog_sections -> blog_content_table (repeatable component)
        });
        const fetchUrl = `/api/blogs?${queryString}`;
        console.log('[BLOG_TABLE_FETCH] Fetch URL:', fetchUrl);
        
        const tableRes = await strapiFetch<{ data: any[] }>(fetchUrl, { 
          revalidate: 2592000, // Cache for 30 days
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
          "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
          // Media: only request url (avoid `*` which can expand invalid keys like `.related`)
          "populate[blog_sections][populate][blog_images][fields][0]": "url",
        });
        const fetchUrl = `/api/blogs?${queryString}`;
        console.log('[BLOG_IMAGES_FETCH] Fetch URL:', fetchUrl);

        const imageRes = await strapiFetch<{ data: any[] }>(fetchUrl, {
          revalidate: 2592000, // Cache for 30 days
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
          "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
          // IMPORTANT (Strapi v5):
          // Do NOT use `*` for media here. It can expand into invalid keys like `coupon_image.related`.
          // Fetch only the media fields we need (url), same style as homepage logo populates.
          "populate[blog_sections][populate][blog_coupon][populate][coupon_image][fields][0]": "url",
          // blog_coupon component scalar fields (new)
          "populate[blog_sections][populate][blog_coupon][fields][0]": "coupon_tag",
          "populate[blog_sections][populate][blog_coupon][fields][1]": "short_or_long",

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
          revalidate: 2592000, // Cache for 30 days
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
      intro_text: blog.attributes?.intro_text || blog.intro_text || '',
      blog_sections: blog.blog_sections || blog.attributes?.blog_sections,
      blog_table: blog.blog_table || blog.attributes?.blog_table,
      blog_coupon: blog.blog_coupon || blog.attributes?.blog_coupon,
      related_merchants: blog.related_merchants || blog.attributes?.related_merchants,
      related_blogs: blog.related_blogs || blog.attributes?.related_blogs,
      categories: blog.categories || blog.attributes?.categories,
    };

    // Extract categories (manyToMany)
    let categories: any[] = [];
    if (blogData.categories) {
      let catsFromCMS: any[] = [];
      if (Array.isArray(blogData.categories)) {
        if (blogData.categories[0]?.data) {
          catsFromCMS = blogData.categories.map((item: any) => item.data || item);
        } else {
          catsFromCMS = blogData.categories;
        }
      } else if (blogData.categories?.data) {
        catsFromCMS = blogData.categories.data;
      }

      categories = catsFromCMS
        .map((c: any) => {
          const cd = c?.attributes || c;
          return {
            id: c?.id || cd?.id,
            name: cd?.name || '',
            slug: cd?.page_slug || '',
          };
        })
        .filter((c: any) => c.id && c.name && c.slug);
    }
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
          logo: logoUrl ? rewriteImageUrl(absolutizeMedia(logoUrl), siteUrl) : null,
        };
      });
    }

    // Extract related blogs - handle all possible formats (same pattern as merchant pages)
    let relatedBlogs: any[] = [];
    const relatedBlogIds: number[] = [];
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
      
      relatedBlogs = relatedFromCMS.map((relatedBlog: any) => {
        const id = relatedBlog.id || relatedBlog.attributes?.id;
        if (id) relatedBlogIds.push(Number(id));
        const thumbRaw =
          relatedBlog.thumbnail ||
          relatedBlog.attributes?.thumbnail ||
          relatedBlog.thumbnail?.data ||
          relatedBlog.attributes?.thumbnail?.data;
        const thumbUrl =
          thumbRaw?.url ||
          thumbRaw?.attributes?.url ||
          thumbRaw?.data?.attributes?.url ||
          relatedBlog.thumbnail?.data?.attributes?.url ||
          relatedBlog.attributes?.thumbnail?.data?.attributes?.url;
        return {
          id,
          title: relatedBlog.blog_title || relatedBlog.attributes?.blog_title || '',
          slug: relatedBlog.page_slug || relatedBlog.attributes?.page_slug || '',
          createdAt: relatedBlog.createdAt || relatedBlog.attributes?.createdAt || '',
          updatedAt: relatedBlog.updatedAt || relatedBlog.attributes?.updatedAt || '',
          thumbnail: thumbUrl ? rewriteImageUrl(absolutizeMedia(thumbUrl), siteUrl) : '/placeholder.svg',
          first_h2: '',
        };
      });
    }

    // blog_table is already fetched separately above (Step 2)

    // We'll merge coupons into each section by index (same approach as blog_table)
    const mapCouponBlocks = (sectionWithCoupons: any) => {
      const secData = sectionWithCoupons?.attributes || sectionWithCoupons;
      const blocksRaw = secData?.blog_coupon || secData?.blog_coupon?.data || [];
      const blocksArr = Array.isArray(blocksRaw) ? blocksRaw : (blocksRaw?.data || []);

      return blocksArr.map((block: any) => {
        const blockData = block?.attributes || block;
        const coupon_tag = blockData?.coupon_tag || '';
        const short_or_long = Boolean(blockData?.short_or_long);
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
          coupon_image: imgUrl ? rewriteImageUrl(absolutizeMedia(imgUrl), siteUrl) : null,
          coupon_tag,
          short_or_long,
          coupons,
        };
      }).filter((b: any) => b.coupons?.length > 0);
    };

    // Step 4: Fetch first H2 for related blogs (title + first section H2 only)
    if (relatedBlogIds.length > 0) {
      try {
        const query = qs({
          // qs helper typing doesn't accept arrays; Strapi accepts comma-separated values for $in
          "filters[id][$in]": relatedBlogIds.join(','),
          "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
          "fields[0]": "id",
          "fields[1]": "blog_title",
          "fields[2]": "page_slug",
          "fields[3]": "updatedAt",
          "populate[blog_sections][fields][0]": "h2_blog_section_title",
          "pagination[pageSize]": Math.min(relatedBlogIds.length, 50),
        });
        const relRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${query}`, {
          revalidate: 2592000, // Cache for 30 days
          tag: `blog-related-h2:${page_slug}`,
        });

        const mapById = new Map<number, string>();
        for (const item of (relRes?.data || [])) {
          const id = Number(item?.id || item?.attributes?.id);
          const sections = item?.attributes?.blog_sections || item?.blog_sections || [];
          const first = Array.isArray(sections) ? sections[0] : null;
          const firstData = first?.attributes || first;
          const firstH2 = firstData?.h2_blog_section_title || '';
          if (id && firstH2) mapById.set(id, firstH2);
        }

        relatedBlogs = relatedBlogs.map((b) => ({
          ...b,
          first_h2: mapById.get(Number(b.id)) || '',
        }));
      } catch (e) {
        console.error('[RELATED_BLOGS_H2_FETCH] Error fetching related blog h2:', e);
      }
    }

    const transformedBlog = {
      id: blogData.id,
      // CMS Field Mapping: blog_title -> title (mapped from /api/blogs collection)
      title: blogData.blog_title || 'Untitled Post',
      page_slug: blogData.page_slug,
      createdAt: blogData.createdAt || new Date().toISOString(),
      updatedAt: blogData.updatedAt || new Date().toISOString(),
      intro_text: blogData.intro_text || '',
      sections: (blogData.blog_sections || []).map((section: any, index: number) => {
        // Handle both Strapi v5 attributes format and flat format
        const sectionData = section.attributes || section;
        
        // Extract new table fields from section level
        const blogHeaderRow = sectionData.blog_header_row || '';
        const sectionHeaderColor = sectionData.header_color || '';
        const sectionHoverColor = sectionData.hover_color || '';
        const sectionBorderColor = sectionData.border_color || '';
        
        // Merge blog_content_table from separate fetch (sectionsWithTables) if available
        // Match sections by index
        let sectionContentTable: any[] = [];
        if (sectionsWithTables.length > index) {
          const sectionWithTable = sectionsWithTables[index];
          const sectionWithTableData = sectionWithTable.attributes || sectionWithTable;
          const sectionContentTableData = sectionWithTableData.blog_content_table || [];
          sectionContentTable = Array.isArray(sectionContentTableData) ? sectionContentTableData : (sectionContentTableData?.data || []);
        }
        
        // Extract and transform blog_content_table
        const blogContentTable = sectionContentTable.map((table: any) => {
          const tableItem = table.attributes || table;
          return {
            id: tableItem.id || table.id || 0,
            column_1: tableItem.content_table_column_1 || '',
            column_2: tableItem.content_table_column_2 || '',
            column_3: tableItem.content_table_column_3 || '',
            column_4: tableItem.content_table_column_4 || '',
            column_5: tableItem.content_table_column_5 || '',
          };
        });
        
        // Backward compatibility: Merge blog_table from separate fetch if blog_content_table is empty
        let sectionTable: any[] = [];
        if (blogContentTable.length === 0 && sectionsWithTables.length > index) {
          const sectionWithTable = sectionsWithTables[index];
          const sectionWithTableData = sectionWithTable.attributes || sectionWithTable;
          const sectionTableData = sectionWithTableData.blog_table || [];
          sectionTable = Array.isArray(sectionTableData) ? sectionTableData : (sectionTableData?.data || []);
        }
        
        // Extract and transform blog_table (backward compatibility)
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
            header_color: tableItem.header_color || '',
            hover_color: tableItem.hover_color || '',
            border_color: tableItem.border_color || '',
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
          if (url) bannerImageUrl = rewriteImageUrl(absolutizeMedia(url), siteUrl);
        }
        
        // Process rich text blocks to rewrite image URLs (server-side only)
        const processRichTextImages = (blocks: any): any => {
          if (!blocks || !Array.isArray(blocks)) return blocks;
          
          return blocks.map((block: any) => {
            if (block.type === 'image' && block.image) {
              // Handle different Strapi data structures
              let imageData = block.image;
              if (imageData?.data) {
                imageData = imageData.data;
              }
              
              // Extract URL from various possible structures
              const imageUrl = imageData?.attributes?.url || imageData?.url || '';
              
              if (imageUrl) {
                // Rewrite image URL using server-side functions
                const absoluteUrl = absolutizeMedia(imageUrl);
                const rewrittenUrl = rewriteImageUrl(absoluteUrl, siteUrl);
                
                // Return block with rewritten URL, preserving structure
                if (block.image?.data) {
                  // Structure: { image: { data: { attributes: {...}, url: ... } } }
                  return {
                    ...block,
                    image: {
                      ...block.image,
                      data: {
                        ...imageData,
                        attributes: {
                          ...(imageData?.attributes || {}),
                          url: rewrittenUrl,
                        },
                        url: rewrittenUrl,
                      },
                    },
                  };
                } else {
                  // Structure: { image: { url: ... } }
                  return {
                    ...block,
                    image: {
                      ...block.image,
                      attributes: {
                        ...(block.image?.attributes || {}),
                        url: rewrittenUrl,
                      },
                      url: rewrittenUrl,
                    },
                  };
                }
              }
            }
            return block;
          });
        };
        
        return {
          id: sectionData.id || section.id || 0,
          h2_title: sectionData.h2_blog_section_title || '',
          table_h3: sectionData.table_h3 || '', // Table title above the table
          banner_image: bannerImageUrl, // Section banner image (first blog_images url)
          blog_texts: processRichTextImages(sectionData.blog_texts || []), // Rich text JSON with processed image URLs
          blog_texts_second: processRichTextImages(sectionData.blog_texts_second || []), // Rich text JSON with processed image URLs
          section_button_text: sectionData.section_button_text || '',
          section_button_link: sectionData.section_button_link || '',
          // New table fields
          blog_header_row: blogHeaderRow, // Comma-separated header row
          header_color: sectionHeaderColor,
          hover_color: sectionHoverColor,
          border_color: sectionBorderColor,
          blog_content_table: blogContentTable, // New content table (array of rows)
          blog_table: blogTable, // Array of table rows (backward compatibility)
          blog_coupon_blocks: sectionCouponBlocks, // Each section can have coupon blocks
        };
      }),
      categories,
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
