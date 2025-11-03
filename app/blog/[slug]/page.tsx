// app/blog/[slug]/page.tsx - Server Component with ISR/SSG
import { notFound } from 'next/navigation';
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import ArticleView from './article-view';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';

export const revalidate = 86400; // ISR - revalidate every 24 hours (articles rarely change)

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  try {
    // Fetch blog post SEO data from Strapi
    const postData = await strapiFetch<{ data: any[] }>(
      `/api/posts?filters[slug][$eq]=${slug}&fields[0]=title&fields[1]=excerpt&fields[2]=seo_title&fields[3]=seo_description&fields[4]=publishedAt`,
      { revalidate: 86400, tag: `blog:${slug}` }
    );
    
    const post = postData?.data?.[0];
    
    if (post) {
      const title = post.seo_title || post.title || `${slug}｜部落格`;
      const description = post.seo_description || post.excerpt || '文章內容';
      
      return pageMeta({
        title,
        description,
        path: `/blog/${slug}`,
      });
    }
  } catch (error) {
    console.error('Error fetching blog post SEO data:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: `${slug}｜部落格`,
    description: '文章內容',
    path: `/blog/${slug}`,
  });
}

export default async function BlogPost({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;

  try {
    // Fetch blog post data with explicit fields and minimal populate
    const postParams = {
      "filters[slug][$eq]": slug,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "excerpt", 
      "fields[3]": "content",
      "fields[4]": "publishedAt",
      "fields[5]": "updatedAt",
      "fields[6]": "slug",
      "fields[7]": "seo_title",
      "fields[8]": "seo_description",
      "populate[cover][fields][0]": "url",
      "populate[author][fields][0]": "name",
      "populate[author][fields][1]": "email",
      "populate[author][populate][avatar][fields][0]": "url",
      "populate[categories][fields][0]": "name",
      "populate[categories][fields][1]": "slug",
    };

    const postData = await strapiFetch<{ data: any[] }>(
      `/api/posts?${qs(postParams)}`,
      { revalidate: 86400, tag: `blog:${slug}` }
    );

    const post = postData?.data?.[0];
    
    if (!post) {
      notFound();
    }

    // Transform post data
    const transformedPost = {
      id: post.id,
      title: post.title || 'Untitled Post',
      excerpt: post.excerpt || '',
      content: post.content || '',
      publishedAt: post.publishedAt || new Date().toISOString(),
      updatedAt: post.updatedAt || new Date().toISOString(),
      slug: post.slug,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      cover: post.cover?.url ? absolutizeMedia(post.cover.url) : null,
      author: {
        name: post.author?.name || 'Dealy Team',
        email: post.author?.email || '',
        avatar: post.author?.avatar?.url ? absolutizeMedia(post.author.avatar.url) : '/placeholder.svg',
      },
      categories: (post.categories || []).map((cat: any) => ({
        name: cat.name,
        slug: cat.slug,
      })),
    };

    // Build breadcrumb JSON-LD
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
    const blogPostUrl = `${siteUrl}/blog/${slug}`;
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '部落格', url: `${siteUrl}/blog` },
      { name: transformedPost.title, url: blogPostUrl },
    ]);

    return (
      <>
        <ArticleView post={transformedPost} />
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
    );

  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}