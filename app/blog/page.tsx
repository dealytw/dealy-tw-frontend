import { pageMeta } from '@/seo/meta';
import { strapiFetch, qs, absolutizeMedia, rewriteImageUrl } from '@/lib/strapi.server';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';
import BlogHomeView from './blog-home-view';

export const revalidate = 86400; // Revalidate every 24 hours - same as homepage since this is the blog homepage

export async function generateMetadata() {
  return pageMeta({
    title: '部落格 | Dealy.TW',
    description: '台灣最新優惠資訊、購物指南與生活分享',
    path: '/blog',
    ogImageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw'}/og-image.png`,
    ogImageAlt: 'Dealy TW 部落格',
  });
}

export default async function BlogHomePage({
  searchParams,
}: {
  searchParams?: { page?: string; category?: string };
}) {
  const marketKey = 'tw'; // Hardcoded for TW frontend
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  // Fetch blog posts with thumbnails, sorted by newest first
  let blogPosts: any[] = [];
  let categories: any[] = [];
  let page = 1;
  let pageCount = 1;
  const pageSize = 24;
  const selectedCategory = (searchParams?.category || '').trim() || null;
  const parsedPage = Number(searchParams?.page || '1');
  if (Number.isFinite(parsedPage) && parsedPage > 0) {
    page = Math.floor(parsedPage);
  }

  try {
    // Fetch blog posts
    const blogRes = await strapiFetch<{ data: any[]; meta?: any }>(`/api/blogs?${qs({
      "filters[publishedAt][$notNull]": "true", // Only published posts
      "filters[market][key][$eq]": marketKey,
      ...(selectedCategory ? { "filters[categories][page_slug][$eq]": selectedCategory } : {}),
      "fields[0]": "id",
      "fields[1]": "blog_title",
      "fields[2]": "page_slug",
      "fields[3]": "intro_text",
      "fields[4]": "createdAt",
      "fields[5]": "updatedAt",
      "fields[6]": "publishedAt",
      "sort[0]": "updatedAt:desc", // Latest update first
      "pagination[page]": String(page),
      "pagination[pageSize]": String(pageSize),
      // Thumbnail image
      "populate[thumbnail][fields][0]": "url",
      // Categories
      "populate[categories][fields][0]": "id",
      "populate[categories][fields][1]": "name",
      "populate[categories][fields][2]": "page_slug",
    })}`, {
      revalidate: 86400, // Cache for 24 hours - same as homepage
      tag: `blog:list:${marketKey}:${selectedCategory || 'all'}:${page}`
    });

    blogPosts = (blogRes?.data || []).map((post: any) => {
      const thumbnailUrl = post.thumbnail?.url 
        ? rewriteImageUrl(absolutizeMedia(post.thumbnail.url), siteUrl)
        : '/placeholder.svg';
      
      const categoryNames = post.categories?.map((cat: any) => cat.name).join(' • ') || '';
      
      return {
        id: post.id,
        title: post.blog_title || post.attributes?.blog_title || '',
        subtitle: post.intro_text || post.attributes?.intro_text || '',
        image: thumbnailUrl,
        category: categoryNames || '最新優惠',
        date: post.updatedAt || post.publishedAt || post.createdAt,
        slug: post.page_slug || post.attributes?.page_slug || '',
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
      };
    });

    pageCount = blogRes?.meta?.pagination?.pageCount || 1;

    // Fetch categories from shared categories API (same as merchants)
    const categoryRes = await strapiFetch<{ data: any[] }>(`/api/categories?${qs({
      "filters[market][key][$eq]": marketKey,
      "fields[0]": "id",
      "fields[1]": "name",
      "fields[2]": "page_slug",
      "sort[0]": "name:asc",
      "pagination[pageSize]": "100",
    })}`, {
      revalidate: 86400, // Cache for 24 hours - same as homepage
      tag: `categories:${marketKey}`
    });

    categories = (categoryRes?.data || []).map((cat: any) => ({
      id: cat.id || cat.documentId,
      name: cat.name || cat.attributes?.name || '',
      slug: cat.page_slug || cat.attributes?.page_slug || '',
    }));
  } catch (error) {
    console.error('Error fetching blog data:', error);
    // Continue with empty arrays - component will handle gracefully
  }

  // Fallback to default category if no categories fetched
  if (categories.length === 0) {
    categories = [
      { id: 'latest-offers', name: '最新優惠', slug: 'latest-offers' },
    ];
  }

  return (
    <BlogHomeView
      blogPosts={blogPosts}
      categories={categories}
      currentPage={page}
      totalPages={pageCount}
      selectedCategory={selectedCategory}
    />
  );
}


