import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SearchProvider } from "@/components/SearchProvider";
import { websiteJsonLd, organizationJsonLd, siteNavigationJsonLd } from "@/lib/jsonld";
import FloatingActionContainer from "@/components/FloatingActionContainer";
import { getDomainConfig as getDomainConfigServer, getMarketLocale, localeToHtmlLang, localeToHreflang } from "@/lib/domain-config";
import { getHreflangLinks } from "@/seo/meta";
import Script from "next/script";
import CWVTracker from "@/components/CWVTracker";
import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export const metadata: Metadata = {
  title: "Dealy - 香港最佳優惠碼平台",
  description: "發現最新最優惠的折扣碼，為你的購物節省更多。Dealy 為您精選 Trip.com、Booking.com 等知名商店的優惠碼，100% 免費使用。",
  authors: [{ name: "Dealy" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Dealy - 香港最佳優惠碼平台",
    description: "發現最新最優惠的折扣碼，為你的購物節省更多。精選知名商店優惠碼，100% 免費使用。",
    type: "website",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lovable_dev",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get domain configuration (server-side)
  const domainConfig = getDomainConfigServer();
  const marketKey = domainConfig.market;
  
  // Fetch market locale from CMS (uses Market.defaultLocale)
  const marketLocale = await getMarketLocale(marketKey);
  const htmlLang = localeToHtmlLang(marketLocale);
  const hreflangCode = localeToHreflang(marketLocale);
  
  // Get site URLs
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
  const alternateUrl = `https://${domainConfig.alternateDomain}`;
  
  // Generate hreflang links for homepage
  const hreflangLinks = getHreflangLinks('/');
  
  // Build sameAs array for Organization schema (link to other domain)
  const sameAs = [alternateUrl];

  // Fetch merchants for search - EXACT same approach as /shop page
  // Using market relation filter: filters[market][key][$eq] to get all merchants for this market
  let searchMerchants: Array<{ id: string | number; name: string; slug: string; logo: string; website: string }> = [];
  try {
    // Match shop page exactly - use same fields and populate structure
    const merchantParams = {
      "filters[market][key][$eq]": marketKey, // Filter by market relation key
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "site_url", // Use site_url for merchant website
      "sort[0]": "merchant_name:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "500", // Same as shop page
      "populate[logo][fields][0]": "url", // Populate logo relation
      "populate[market][fields][0]": "key", // Populate market relation
    };

    console.log(`[Layout] Fetching merchants for search via market relation, market: ${marketKey}`);
    console.log(`[Layout] Query params:`, merchantParams);
    
    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 3600, tag: `search:all-merchants:${marketKey}` }
    );

    console.log(`[Layout] Received merchant data:`, {
      dataLength: merchantsData?.data?.length || 0,
      firstMerchant: merchantsData?.data?.[0] ? {
        id: merchantsData.data[0].id,
        merchant_name: merchantsData.data[0].merchant_name,
        slug: merchantsData.data[0].slug,
        hasLogo: !!merchantsData.data[0].logo,
        hasMarket: !!merchantsData.data[0].market
      } : null
    });

    searchMerchants = (merchantsData?.data || []).map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
      website: merchant.site_url || merchant.website || "",
    }));

    console.log(`[Layout] Prefetched ${searchMerchants.length} merchants for search`);
    
    if (searchMerchants.length === 0) {
      console.warn(`[Layout] WARNING: No merchants fetched! Check if market '${marketKey}' has merchants or API connection.`);
    } else {
      console.log(`[Layout] Sample merchants:`, searchMerchants.slice(0, 3).map(m => ({ name: m.name, slug: m.slug })));
    }
  } catch (error: any) {
    console.error('[Layout] Error fetching merchants for search:', error);
    console.error('[Layout] Error details:', error.message, error.stack);
    // Continue with empty array - search will still work but won't have instant results
  }
  
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        {/* Preconnect to CMS for faster API calls */}
        <link rel="preconnect" href="https://cms.dealy.tw" crossOrigin="" />
        <link rel="dns-prefetch" href="//cms.dealy.tw" />
        
        {/* Hreflang tags for cross-domain SEO */}
        {hreflangLinks.map((link) => (
          <link key={link.hreflang} rel="alternate" hreflang={link.hreflang} href={link.href} />
        ))}
        
        {/* Explicit favicon links for best SEO and browser compatibility */}
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" sizes="any" />
        <link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Fallback for older browsers */}
        <link rel="alternate icon" href="/favicon.svg" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <SearchProvider initialMerchants={searchMerchants}>
            {/* Site-wide JSON-LD: WebSite + Organization */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  websiteJsonLd({ 
                    siteName: domainConfig.name, 
                    siteUrl: siteUrl, 
                    searchUrl: `${siteUrl}/search`,
                    locale: marketLocale
                  })
                ),
              }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  organizationJsonLd({ 
                    name: domainConfig.name, 
                    url: siteUrl, 
                    logo: `${siteUrl}/favicon.svg`,
                    sameAs: sameAs
                  })
                ),
              }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  siteNavigationJsonLd([
                    { name: '首頁', url: `${siteUrl}/` },
                    { name: '商家', url: `${siteUrl}/shop` },
                    { name: '特別優惠', url: `${siteUrl}/special-offers` },
                  ])
                ),
              }}
            />
            {children}
            <FloatingActionContainer />
            {/* CWVTracker temporarily disabled - web-vitals not installed */}
            {/* <CWVTracker /> */}
          </SearchProvider>
        </Providers>
      </body>
    </html>
  );
}
