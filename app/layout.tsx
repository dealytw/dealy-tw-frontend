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
import { getHomePageData } from "@/lib/homepage-loader";

// Default metadata (will be overridden by page-specific metadata)
// This is just a fallback for pages that don't define their own metadata
export const metadata: Metadata = {
  title: "Dealy TW 台灣最新優惠平台",
  description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
  authors: [{ name: "Dealy TW" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Dealy TW 台灣最新優惠平台",
    description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
    type: "website",
    images: ["/favicon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dealy TW 台灣最新優惠平台",
    description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
    images: ["/favicon.svg"],
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
  
  // Build sameAs array for Organization schema (link to other domain)
  const sameAs = [alternateUrl];
  
  // Note: Hreflang and canonical links are handled by Next.js metadata API via pageMeta()
  // No need to add them manually in <head> to avoid duplicates
  
  // Fetch hero background image URL for homepage preload
  // Note: This will be added to all pages, but only affects homepage LCP
  // The browser will only preload if the image is actually used on the page
  let heroBgUrl: string | undefined;
  try {
    const homepageData = await getHomePageData(marketKey);
    heroBgUrl = homepageData.hero?.bgUrl;
  } catch (error) {
    // Silently fail - homepage will handle its own data fetching
    // This is just for preload optimization
  }

  // Fetch merchants for search - EXACT same approach as /shop page
  // Using market relation filter: filters[market][key][$eq] to get all merchants for this market
  let searchMerchants: Array<{ id: string | number; name: string; slug: string; logo: string; website: string }> = [];
  try {
    // Match shop page exactly - use same fields and populate structure
    const merchantParams = {
      "filters[market][key][$eq]": marketKey, // Filter by market relation key
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "page_slug",
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
        slug: merchantsData.data[0].page_slug,
        hasLogo: !!merchantsData.data[0].logo,
        hasMarket: !!merchantsData.data[0].market
      } : null
    });

    searchMerchants = (merchantsData?.data || []).map((merchant: any) => {
      const logoUrl = merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "";
      return {
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.page_slug,
        // Rewrite logo URL to use custom domain /upload path for better caching and SEO
        logo: logoUrl ? rewriteImageUrl(logoUrl, siteUrl) : "",
        website: merchant.site_url || merchant.website || "",
      };
    });

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
        {/* Google Tag Manager - Lazy loaded for better performance */}
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-N8WGJVQS');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Preconnect to CMS for faster API calls */}
        <link rel="preconnect" href="https://cms.dealy.tw" crossOrigin="" />
        <link rel="dns-prefetch" href="//cms.dealy.tw" />
        
        {/* Favicon links - minimal set for best SEO and browser compatibility */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        
        {/* Preload hero background image for homepage LCP optimization */}
        {heroBgUrl && (
          <link
            rel="preload"
            as="image"
            href={heroBgUrl}
            fetchPriority="high"
          />
        )}
      </head>
      <body suppressHydrationWarning itemScope itemType="https://schema.org/WebPage">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N8WGJVQS"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
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
            <CWVTracker />
          </SearchProvider>
        </Providers>
      </body>
    </html>
  );
}
