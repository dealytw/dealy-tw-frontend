import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { websiteJsonLd, organizationJsonLd, siteNavigationJsonLd } from "@/lib/jsonld";
import FloatingActionContainer from "@/components/FloatingActionContainer";
import { getDomainConfig, getMarketLocale, localeToHtmlLang, localeToHreflang } from "@/lib/domain-config";
import { getHreflangLinks } from "@/seo/meta";

export const metadata: Metadata = {
  title: "Dealy - 香港最佳優惠碼平台",
  description: "發現最新最優惠的折扣碼，為你的購物節省更多。Dealy 為您精選 Trip.com、Booking.com 等知名商店的優惠碼，100% 免費使用。",
  authors: [{ name: "Dealy" }],
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
  // Get domain configuration
  const domainConfig = getDomainConfig();
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
    <html lang={htmlLang} suppressHydrationWarning>
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
                  logo: `${siteUrl}/favicon.ico`,
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
        </Providers>
      </body>
    </html>
  );
}
