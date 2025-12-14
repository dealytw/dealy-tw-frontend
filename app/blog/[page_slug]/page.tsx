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

// Revalidate every 24 hours - blog posts don't change frequently
export const revalidate = 86400;
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
      revalidate: 86400,
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
    // Fetch blog data with ISR (same pattern as merchant pages)
    const blogRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      "filters[page_slug][$eq]": page_slug,
      "fields[0]": "id",
      "fields[1]": "blog_title",
      "fields[2]": "page_slug",
      "fields[3]": "createdAt",
      "fields[4]": "updatedAt",
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
      revalidate: 86400,
      tag: `blog:${page_slug}` 
    });

    const blog = blogRes?.data?.[0];
    
    if (!blog) {
      // Log failure reason for better error handling
      console.error(`[Blog Page] Blog not found: ${page_slug}`, {
        response: blogRes,
        hasData: !!blogRes?.data,
        dataLength: blogRes?.data?.length || 0,
        timestamp: new Date().toISOString(),
      });
      notFound();
    }

    // Extract blog data - handle both Strapi v5 attributes format and flat format
    const getBlogField = (field: string) => {
      return blog.attributes?.[field] || blog[field];
    };

    // Handle manyToMany relations - same pattern as merchant pages
    const getRelatedMerchants = (merchants: any) => {
      if (!merchants) return [];
      if (Array.isArray(merchants)) {
        if (merchants[0]?.data) {
          return merchants.map((item: any) => item.data || item);
        }
        return merchants;
      }
      if (merchants.data) return merchants.data;
      return [];
    };

    const getRelatedBlogs = (blogs: any) => {
      if (!blogs) return [];
      if (Array.isArray(blogs)) {
        if (blogs[0]?.data) {
          return blogs.map((item: any) => item.data || item);
        }
        return blogs;
      }
      if (blogs.data) return blogs.data;
      return [];
    };

    const transformedBlog = {
      id: blog.id || blog.attributes?.id,
      title: getBlogField('blog_title') || 'Untitled Post',
      page_slug: getBlogField('page_slug') || page_slug,
      createdAt: getBlogField('createdAt') || new Date().toISOString(),
      updatedAt: getBlogField('updatedAt') || new Date().toISOString(),
      sections: [], // Will be populated later
      related_merchants: getRelatedMerchants(blog.related_merchants || blog.attributes?.related_merchants).map((merchant: any) => ({
        id: merchant.id || merchant.attributes?.id,
        name: merchant.merchant_name || merchant.attributes?.merchant_name || '',
        slug: merchant.page_slug || merchant.attributes?.page_slug || '',
        logo: merchant.logo?.url || merchant.logo?.attributes?.url || merchant.attributes?.logo?.url 
          ? absolutizeMedia(merchant.logo?.url || merchant.logo?.attributes?.url || merchant.attributes?.logo?.url) 
          : null,
      })),
      related_blogs: getRelatedBlogs(blog.related_blogs || blog.attributes?.related_blogs).map((relatedBlog: any) => ({
        id: relatedBlog.id || relatedBlog.attributes?.id,
        title: relatedBlog.blog_title || relatedBlog.attributes?.blog_title || '',
        slug: relatedBlog.page_slug || relatedBlog.attributes?.page_slug || '',
        createdAt: relatedBlog.createdAt || relatedBlog.attributes?.createdAt || '',
        updatedAt: relatedBlog.updatedAt || relatedBlog.attributes?.updatedAt || '',
        thumbnail: null,
      })),
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
    // Log failure reason for better error handling
    console.error(`[Blog Page] Error fetching blog post: ${page_slug}`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      page_slug,
      timestamp: new Date().toISOString(),
      // Additional context
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    notFound();
  }
}
