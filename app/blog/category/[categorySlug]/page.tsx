import { pageMeta } from '@/seo/meta';
import BlogHomeView from '../../blog-home-view';
import { fetchBlogListing } from '../../_listing';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  return pageMeta({
    title: '部落格 | Dealy.TW',
    description: '台灣最新優惠資訊、購物指南與生活分享',
    path: `/blog/category/${categorySlug}`,
    ogImageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw'}/og-image.png`,
    ogImageAlt: 'Dealy TW 部落格',
  });
}

export default async function BlogHomePageByCategory({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const marketKey = 'tw';
  const { categorySlug } = await params;
  const pageNum = 1;
  const pageSize = 24;

  const selectedCategory = (categorySlug || '').trim() || null;
  const { blogPosts, categories, pageCount } = await fetchBlogListing({
    marketKey,
    page: pageNum,
    pageSize,
    selectedCategory,
  });

  return (
    <BlogHomeView
      blogPosts={blogPosts}
      categories={categories}
      currentPage={pageNum}
      totalPages={pageCount}
      selectedCategory={selectedCategory}
    />
  );
}

