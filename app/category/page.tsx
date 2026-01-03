// app/category/page.tsx - Server Component with ISR
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { pageMeta } from '@/seo/meta';
import { strapiFetch, qs } from '@/lib/strapi.server';

export const revalidate = 604800; // 1 week - categories are relatively static

export async function generateMetadata() {
  return pageMeta({
    title: '所有分類｜Dealy.TW',
    description: '瀏覽所有分類，快速找到你想要的商家與優惠。',
    path: '/category',
  });
}

export default async function CategoryIndexPage() {
  const marketKey = 'tw'; // Hardcoded for TW frontend (requested)

  const params = {
    'filters[market][key][$eq]': marketKey,
    'fields[0]': 'id',
    'fields[1]': 'name',
    'fields[2]': 'page_slug',
    'sort[0]': 'name:asc',
    'pagination[page]': '1',
    'pagination[pageSize]': '500',
    'populate[market][fields][0]': 'key',
  };

  const categoriesRes = await strapiFetch<{ data: any[] }>(
    `/api/categories?${qs(params)}`,
    { revalidate: 604800, tag: `category:list:${marketKey}` }
  );

  const categories = (categoriesRes?.data || [])
    .map((c: any) => ({
      id: String(c.id ?? ''),
      name: c.name || c.attributes?.name || '',
      slug: c.page_slug || c.attributes?.page_slug || '',
    }))
    .filter((c: any) => c.name && c.slug);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Affiliate Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1 px-2">
        <div className="max-w-full mx-auto px-2">
          <p className="text-[8px] text-gray-600 text-center leading-tight">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">所有分類</h1>
          <p className="text-gray-700 mb-8">點擊分類以查看相關商家與優惠。</p>

          {categories.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
              目前沒有可顯示的分類。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-500 mt-1">/category/{cat.slug}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

