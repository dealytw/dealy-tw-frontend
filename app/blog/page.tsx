import { pageMeta } from '@/seo/meta';
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
  // TODO: Fetch real blog data from Strapi
  // For now, using dummy data as requested
  
  return <BlogHomeView />;
}


