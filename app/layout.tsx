import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SearchProvider } from "@/components/SearchProvider";
import { websiteJsonLd, organizationJsonLd, siteNavigationJsonLd } from "@/lib/jsonld";
import FloatingActionContainer from "@/components/FloatingActionContainer";
import { getDomainConfig as getDomainConfigServer, getMarketLocale, localeToHtmlLang, localeToHreflang } from "@/lib/domain-config";
import { getHreflangLinks } from "@/seo/meta";
import { notoSansTC } from "@/lib/fonts";
import Script from "next/script";
import CWVTracker from "@/components/CWVTracker";

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
  
  return (
    <html lang={htmlLang} suppressHydrationWarning className={notoSansTC.variable}>
      <head>
        {/* Preconnect to CMS for faster API calls */}
        <link rel="preconnect" href="https://cms.dealy.tw" crossOrigin="" />
        <link rel="dns-prefetch" href="//cms.dealy.tw" />
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
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
        </Providers>
        
        {/* Ad Link verification script - Load after interactive */}
        <Script id="converly-init" strategy="afterInteractive">
          {`var ConverlyCustomData = {channelId: null};`}
        </Script>
        <Script 
          src="https://cdn.affiliates.one/production/adlinks/1c6d7c838b3bde9154ede84d8c4ef4ab8420bf1990f82b63a3af81acecfc3323.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
