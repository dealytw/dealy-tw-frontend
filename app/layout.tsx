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
  const DEBUG = process.env.NODE_ENV !== 'production';
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
  
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        {/* JSON-LD should be emitted from server <head> (not inside client Providers)
            to avoid duplication in Google-rendered HTML. */}
        <script
          id="jsonld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              websiteJsonLd({
                siteName: "Dealy TW",
                siteUrl: siteUrl,
                searchUrl: `${siteUrl}/search`,
                locale: marketLocale,
                image: `${siteUrl}/dealytwlogo.svg`,
                description:
                  "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。",
              }),
              null,
              0
            ),
          }}
        />
        <script
          id="jsonld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              organizationJsonLd({
                name: "Dealy TW",
                url: siteUrl,
                logo: `${siteUrl}/dealytwlogo.svg`,
                sameAs: sameAs,
                id: `${siteUrl}#organization`,
              }),
              null,
              0
            ),
          }}
        />
        <script
          id="jsonld-sitenav"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              siteNavigationJsonLd([
                { name: '首頁', url: `${siteUrl}/` },
                { name: '商家', url: `${siteUrl}/shop` },
                { name: '特別優惠', url: `${siteUrl}/special-offers` },
              ]),
              null,
              0
            ),
          }}
        />
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
          <SearchProvider marketKey={marketKey} hotstoreMerchants={hotstoreMerchants}>
            {children}
            <FloatingActionContainer />
            <CWVTracker />
          </SearchProvider>
        </Providers>
      </body>
    </html>
  );
}
