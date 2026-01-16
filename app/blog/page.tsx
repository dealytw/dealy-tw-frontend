import { pageMeta } from '@/seo/meta';
import BlogHomeView from './blog-home-view';
import { fetchBlogListing } from './_listing';

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
}: {
}) {
  const marketKey = 'tw'; // Hardcoded for TW frontend

  const pageSize = 24;
  const page = 1;
  const selectedCategory = null;

  try {
    const { blogPosts, categories, pageCount } = await fetchBlogListing({
      marketKey,
      page,
      pageSize,
      selectedCategory,
    });

    return (
      <BlogHomeView
        blogPosts={blogPosts}
        categories={categories}
        currentPage={page}
        totalPages={pageCount}
        selectedCategory={selectedCategory}
      />
    );
  } catch (error) {
    console.error('Error fetching blog data:', error);
    // Continue with empty arrays - component will handle gracefully
  }

  return (
    <BlogHomeView
      blogPosts={[]}
      categories={[{ id: 'latest-offers', name: '最新優惠', slug: 'latest-offers' }]}
      currentPage={page}
      totalPages={1}
      selectedCategory={selectedCategory}
    />
  );
}


