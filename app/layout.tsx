import type { Metadata } from "next";
import "./globals.css";
// Blog page implementation reverted - will be re-implemented with proper approach
import { Providers } from "@/components/providers";
import { SearchProvider } from "@/components/SearchProvider";
import { websiteJsonLd, organizationJsonLd, siteNavigationJsonLd } from "@/lib/jsonld";
import FloatingActionContainer from "@/components/FloatingActionContainer";
import { getDomainConfig as getDomainConfigServer, getMarketLocale, localeToHtmlLang, localeToHreflang } from "@/lib/domain-config";
import Script from "next/script";
import CWVTracker from "@/components/CWVTracker";
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl } from "@/lib/strapi.server";
import { getHomePageData } from "@/lib/homepage-loader";

// Default metadata (will be overridden by page-specific metadata)
// This is just a fallback for pages that don't define their own metadata
export const metadata: Metadata = {
  title: "Dealy TW 台灣最新優惠平台",
  description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
  authors: [{ name: "Dealy TW" }],
  icons: {
    // Primary ICO for Google Search Results - MUST be first and explicit
    // Google requires: minimum 48x48 pixels, accessible at /favicon.ico
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" }, // PRIMARY - Google Search Results looks for this first (explicit type)
      { url: "/favicon.ico", sizes: "any" }, // Alternative format for browser compatibility
      // Removed SVG and redundant PNGs - they create noise and confuse Google
      // ICO file contains all needed sizes (16x16, 32x32, 48x48) internally
    ],
    shortcut: "/favicon.ico", // Legacy support
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }, // iOS devices only
    ],
  },
  openGraph: {
    title: "Dealy TW 台灣最新優惠平台",
    description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
    type: "website",
    images: ["/og-image.png"], // Use PNG for better social media compatibility
  },
  twitter: {
    card: "summary_large_image",
    title: "Dealy TW 台灣最新優惠平台",
    description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
    images: ["/og-image.png"], // Use PNG for better social media compatibility
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get domain configuration (server-side)
  const domainConfig = getDomainConfigServer();
  const marketKey = domainConfig.market;
  
  // Fetch market locale from CMS (uses Market.defaultLocale)
  // Wrap in try-catch to prevent 500 errors if CMS is unavailable
  let marketLocale: string;
  try {
    marketLocale = await getMarketLocale(marketKey);
  } catch (error) {
    console.error('[Layout] Error fetching market locale, using fallback:', error);
    // Fallback based on market key
    marketLocale = marketKey.toLowerCase() === 'hk' ? 'zh-Hant-HK' : 'zh-Hant-TW';
  }
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

  // Fetch hotstore merchants for NavigationMenu (server-side)
  let hotstoreMerchants: Array<{ id: string; name: string; slug: string; logoUrl: string | null }> = [];
  try {
    const hotstoreRes = await strapiFetch<{ data: any[] }>(`/api/hotstores?${qs({
      "filters[market][key][$eq]": marketKey,
      "populate[merchants][fields][0]": "id",
      "populate[merchants][fields][1]": "merchant_name",
      "populate[merchants][fields][2]": "page_slug",
      "populate[merchants][populate][logo][fields][0]": "url",
    })}`, { 
      revalidate: 15552000, // 6 months (180 days) - hotstore data rarely changes 
      tag: `hotstore:${marketKey}` 
    });

    if (hotstoreRes.data && hotstoreRes.data.length > 0) {
      const hotstore = hotstoreRes.data[0];
      
      let merchantsFromCMS = [];
      if (Array.isArray(hotstore?.merchants)) {
        if (hotstore.merchants[0]?.data) {
          merchantsFromCMS = hotstore.merchants.map((item: any) => item.data || item);
        } else {
          merchantsFromCMS = hotstore.merchants;
        }
      } else if (hotstore?.merchants?.data) {
        merchantsFromCMS = hotstore.merchants.data;
      }

      hotstoreMerchants = merchantsFromCMS.map((merchant: any) => ({
        id: merchant.id.toString(),
        name: merchant.merchant_name || merchant.name || '',
        slug: merchant.page_slug || '',
        logoUrl: merchant.logo?.url ? rewriteImageUrl(absolutizeMedia(merchant.logo.url)) : null,
      }));
    }
  } catch (error) {
    console.error('Error fetching hotstore merchants in layout:', error);
    // Silently fail - NavigationMenu will show empty state
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
        
        {/* Preconnect to Strapi CDN for faster image loading (critical for LCP) */}
        <link rel="preconnect" href="https://ingenious-charity-13f9502d24.media.strapiapp.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//ingenious-charity-13f9502d24.media.strapiapp.com" />
        
        {/* Preload hero background image if available (critical for LCP) */}
        {heroBgUrl && (
          <link rel="preload" as="image" href={heroBgUrl} fetchPriority="high" />
        )}
        
        {/* Favicon links - WordPress-style optimization for Google Search Results */}
        {/* PRIMARY: ICO with explicit type - Google's preferred format (MUST be first) */}
        {/* WordPress uses this exact format, which Google crawls faster */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Alternative format for maximum browser compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Legacy shortcut icon - WordPress includes this for compatibility */}
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* Apple touch icon for iOS devices only */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Preload favicon AFTER link tags (WordPress-style: helps Google discover faster) */}
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
        {/* 
          REMOVED: SVG and redundant PNG fallbacks
          - SVG creates noise and Google prefers ICO
          - Multiple PNGs confuse crawlers
          - ICO file contains all needed sizes (16x16, 32x32, 48x48) internally
        */}
        
        {/* Web Manifest for PWA support */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme Color for mobile browser address bar */}
        <meta name="theme-color" content="#ffffff" />
        
        {/* Preload hero background image for homepage LCP optimization - Only on homepage */}
        {/* Note: Preload is moved to homepage component to avoid warnings on other pages */}
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
          <SearchProvider initialMerchants={searchMerchants} hotstoreMerchants={hotstoreMerchants}>
            {/* Site-wide JSON-LD: WebSite + Organization */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  websiteJsonLd({ 
                    siteName: domainConfig.name, 
                    siteUrl: siteUrl, 
                    searchUrl: `${siteUrl}/search`,
                    locale: marketLocale,
                    image: `${siteUrl}/dealytwlogo.svg`, // Use image instead of logo (WebSite doesn't support logo)
                    description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。"
                    // Note: publisher removed - WebSite doesn't support publisher property (use publisherId in webPageJsonLd instead)
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
                    logo: `${siteUrl}/dealytwlogo.svg`, // Use logo, not favicon for structured data
                    sameAs: sameAs,
                    id: `${siteUrl}#organization` // Use same @id as merchant page to avoid duplication
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
