import { notFound } from 'next/navigation';
import { strapiFetch, qs } from '@/lib/strapi.server';
import { pageMeta } from '@/seo/meta';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// ISR Configuration - Incremental Static Regeneration
export const revalidate = 86400; // Revalidate every day
export const dynamic = 'auto'; // Enable ISR

// Reserved slugs that should not be handled by this page
const RESERVED_SLUGS = ['shop', 'blog', 'category', 'special-offers', 'search', 'submit-coupons', 'api', '_next', 'sitemap'];

// Generate static params at build time
export async function generateStaticParams() {
  // Try to fetch from Strapi, but always return at least common legal pages as fallback
  const commonLegalPages = [{ slug: 'about' }, { slug: 'privacy' }, { slug: 'terms' }];
  
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    const params = {
      "filters[market][key][$eq]": market,
      "fields[0]": "page_slug",
      "pagination[pageSize]": "100",
    };

    const response = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs(params)}`,
      { revalidate: 86400 }
    );

    const slugs = (response?.data || []).map((page: any) => ({
      slug: page.page_slug,
    }));

    // If we got slugs from CMS, use those; otherwise use fallback
    return slugs.length > 0 ? slugs : commonLegalPages;
  } catch (error) {
    console.error('Error generating static params for legal pages:', error);
    // Return fallback pages so they can at least be generated
    return commonLegalPages;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
  const ogImageUrl = `${siteUrl}/dealytwlogo.svg`;
  const ogImageAlt = 'Dealy TW 台灣最新優惠平台';
  
  // Check if slug is reserved
  if (RESERVED_SLUGS.includes(slug)) {
    return pageMeta({
      title: `${slug} | Dealy.TW`,
      description: '',
      path: `/${slug}`,
      ogImageUrl,
      ogImageAlt,
    });
  }
  
  try {
    const pageParams = {
      "filters[page_slug][$eq]": slug,
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "seo_title",
      "fields[3]": "seo_description",
    };

    const pageData = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs(pageParams)}`,
      { revalidate: 86400, tag: `legal:${slug}` }
    );

    const page = pageData?.data?.[0];
    
    if (!page) {
      return pageMeta({
        title: `${slug} | Dealy.TW`,
        description: '',
        path: `/${slug}`,
        ogImageUrl,
        ogImageAlt,
      });
    }

    const title = page.seo_title || page.title || `${slug} | Dealy.TW`;
    const description = page.seo_description || '';

    return pageMeta({
      title,
      description,
      path: `/${slug}`,
      ogImageUrl,
      ogImageAlt,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return pageMeta({
      title: `${slug} | Dealy.TW`,
      description: '',
      path: `/${slug}`,
      ogImageUrl,
      ogImageAlt,
    });
  }
}

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  // Check if slug is reserved - if so, let other routes handle it
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  try {
    const pageParams = {
      "filters[page_slug][$eq]": slug,
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "content",
      "fields[3]": "page_slug",
      "pagination[pageSize]": "1",
    };

    const pageData = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs(pageParams)}`,
      { revalidate: 86400, tag: `legal:${slug}` }
    );

    const page = pageData?.data?.[0];
    
    if (!page) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {page.title}
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <LegalPageContent content={page.content} />
          </div>
        </main>
        
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error fetching legal page:', error);
    notFound();
  }
}

// Helper component to render rich text content
function LegalPageContent({ content }: { content: any }) {
  if (!content) return null;
  
  // If it's a string, render directly
  if (typeof content === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  
  // If it's structured content (Strapi blocks), render each block
  if (Array.isArray(content)) {
    return (
      <div className="space-y-6">
        {content.map((block: any, index: number) => {
          if (block.type === 'paragraph') {
            const text = extractText(block.children || []);
            return <p key={index} dangerouslySetInnerHTML={{ __html: text }} />;
          }
          if (block.type === 'heading') {
            const text = extractText(block.children || []);
            const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
            return <HeadingTag key={index} dangerouslySetInnerHTML={{ __html: text }} />;
          }
          if (block.type === 'list') {
            const items = block.children?.map((item: any) => extractText(item.children || [])) || [];
            const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className="list-disc pl-6 space-y-2">
                {items.map((item: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ListTag>
            );
          }
          return null;
        })}
      </div>
    );
  }
  
  return null;
}

// Helper function to extract text from rich text nodes
function extractText(nodes: any[]): string {
  if (!nodes || !Array.isArray(nodes)) return '';
  
  return nodes.map((node: any) => {
    if (typeof node === 'string') return node;
    
    let text = node.text || '';
    
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    
    return text;
  }).join('');
}

