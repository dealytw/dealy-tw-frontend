import { pageMeta } from '@/seo/meta';
import { strapiFetch, qs, absolutizeMedia, rewriteImageUrl } from '@/lib/strapi.server';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';
import BlogHomeView from './blog-home-view';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata() {
  return pageMeta({
    title: '部落格 | Dealy.TW',
    description: '台灣最新優惠資訊、購物指南與生活分享',
    path: '/blog',
    ogImageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw'}/dealytwlogo.svg`,
    ogImageAlt: 'Dealy TW 部落格',
  });
}

export default async function BlogHomePage() {
  const marketKey = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  // Fetch blog posts with thumbnails, sorted by newest first
  let blogPosts: any[] = [];
  let categories: any[] = [];

  try {
    // Fetch blog posts
    const blogRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
      "filters[publishedAt][$notNull]": "true", // Only published posts
      "filters[market][key][$eq]": marketKey,
      "fields[0]": "id",
      "fields[1]": "blog_title",
      "fields[2]": "page_slug",
      "fields[3]": "intro_text",
      "fields[4]": "createdAt",
      "fields[5]": "updatedAt",
      "fields[6]": "publishedAt",
      "sort[0]": "publishedAt:desc", // Newest first
      "pagination[pageSize]": "50", // Get enough posts for display
      // Thumbnail image
      "populate[thumbnail][fields][0]": "url",
      // Categories
      "populate[categories][fields][0]": "id",
      "populate[categories][fields][1]": "name",
      "populate[categories][fields][2]": "page_slug",
    })}`, {
      revalidate: 3600,
      tag: 'blog:list'
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
        date: post.publishedAt || post.createdAt || post.updatedAt,
        slug: post.page_slug || post.attributes?.page_slug || '',
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
      };
    });

    // Fetch categories
    const categoryRes = await strapiFetch<{ data: any[] }>(`/api/blog-categories?${qs({
      "filters[market][key][$eq]": marketKey,
      "fields[0]": "id",
      "fields[1]": "name",
      "fields[2]": "page_slug",
      "sort[0]": "name:asc",
    })}`, {
      revalidate: 3600,
      tag: 'blog:categories'
    });

    categories = (categoryRes?.data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name || cat.attributes?.name || '',
      slug: cat.page_slug || cat.attributes?.page_slug || '',
    }));
  } catch (error) {
    console.error('Error fetching blog data:', error);
    // Continue with empty arrays - component will handle gracefully
  }

  // Add "最新優惠" as first category placeholder
  const categoriesWithPlaceholder = [
    { id: 'latest-offers', name: '最新優惠', slug: 'latest-offers' },
    ...categories
  ];

  return <BlogHomeView blogPosts={blogPosts} categories={categoriesWithPlaceholder} />;
}


