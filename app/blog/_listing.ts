import { strapiFetch, qs, absolutizeMedia, rewriteImageUrl } from '@/lib/strapi.server';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';

export async function fetchBlogListing(params: {
  marketKey: string;
  page: number;
  pageSize: number;
  selectedCategory: string | null;
}) {
  const { marketKey, page, pageSize, selectedCategory } = params;

  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  const blogRes = await strapiFetch<{ data: any[]; meta?: any }>(`/api/blogs?${qs({
    "filters[publishedAt][$notNull]": "true",
    "filters[market][key][$eq]": marketKey,
    ...(selectedCategory ? { "filters[categories][page_slug][$eq]": selectedCategory } : {}),
    "fields[0]": "id",
    "fields[1]": "blog_title",
    "fields[2]": "page_slug",
    "fields[3]": "intro_text",
    "fields[4]": "createdAt",
    "fields[5]": "updatedAt",
    "fields[6]": "publishedAt",
    "sort[0]": "updatedAt:desc",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    "populate[thumbnail][fields][0]": "url",
    "populate[categories][fields][0]": "id",
    "populate[categories][fields][1]": "name",
    "populate[categories][fields][2]": "page_slug",
  })}`, {
    revalidate: 86400,
    tag: `blog:list:${marketKey}:${selectedCategory || 'all'}:${page}`,
  });

  const blogPosts = (blogRes?.data || []).map((post: any) => {
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

  const pageCount = blogRes?.meta?.pagination?.pageCount || 1;

  const categoryRes = await strapiFetch<{ data: any[] }>(`/api/categories?${qs({
    "filters[market][key][$eq]": marketKey,
    "fields[0]": "id",
    "fields[1]": "name",
    "fields[2]": "page_slug",
    "sort[0]": "name:asc",
    "pagination[pageSize]": "100",
  })}`, {
    revalidate: 86400,
    tag: `categories:${marketKey}`,
  });

  let categories = (categoryRes?.data || []).map((cat: any) => ({
    id: cat.id || cat.documentId,
    name: cat.name || cat.attributes?.name || '',
    slug: cat.page_slug || cat.attributes?.page_slug || '',
  }));

  if (categories.length === 0) {
    categories = [{ id: 'latest-offers', name: '最新優惠', slug: 'latest-offers' }];
  }

  return { blogPosts, categories, pageCount };
}

