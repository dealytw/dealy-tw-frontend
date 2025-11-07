// Minimal helpers to generate JSON-LD blocks used on pages.
// Keep objects serializable and compact for SEO.

type UrlString = string;

function toTaipeiIso(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  // Convert to ISO then mark +08:00 to reflect Taiwan time
  const iso = d.toISOString();
  return iso.replace(/Z$/, '+08:00');
}

export function websiteJsonLd(opts: { siteName: string; siteUrl: UrlString; searchUrl?: UrlString; locale?: string }) {
  const { siteName, siteUrl, searchUrl, locale } = opts;
  
  // Convert Market.defaultLocale to schema.org format
  // "zh-Hant-HK" -> "zh-HK", "zh-Hant-TW" -> "zh-TW"
  let inLanguage = 'zh-TW'; // Default fallback
  if (locale === 'zh-Hant-HK') {
    inLanguage = 'zh-HK';
  } else if (locale === 'zh-Hant-TW') {
    inLanguage = 'zh-TW';
  } else if (locale) {
    inLanguage = locale;
  }
  
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    inLanguage,
  };
  if (searchUrl) {
    obj.potentialAction = {
      '@type': 'SearchAction',
      target: `${searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    };
  }
  return obj;
}

export function organizationJsonLd(opts: { name: string; url: UrlString; logo?: UrlString; sameAs?: UrlString[] }) {
  const { name, url, logo, sameAs } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: UrlString }>, breadcrumbId?: UrlString) {
  const lastItem = items[items.length - 1];
  const breadcrumbUrl = breadcrumbId || lastItem?.url || '';
  
  return {
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'BreadcrumbList',
      '@id': `${breadcrumbUrl}#breadcrumb`,
      itemListElement: items.map((it, idx) => ({
        '@type': 'ListItem',
        position: String(idx + 1),
        item: {
          '@id': it.url,
          name: it.name,
        },
      })),
    }],
  };
}

export function offersItemListJsonLd(coupons: Array<{
  value?: string;
  title?: string;
  code?: string | null;
  status?: 'active' | 'expired';
  expires_at?: string | null;
  url: UrlString;
}>) {
  const items = coupons.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Offer',
      name: c.value || c.title || '優惠',
      description: (c.title || '').slice(0, 160),
      availability: c.status === 'expired' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      validThrough: toTaipeiIso(c.expires_at),
      url: c.url,
      sku: c.code || undefined,
      priceCurrency: undefined,
    },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items,
  };
}

export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs?.length) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function howToJsonLd(title: string, steps: string[]) {
  if (!steps?.length) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: steps.map((s) => ({ '@type': 'HowToStep', text: s })),
  };
}

export function imageObjectJsonLd(opts: { url: UrlString; width?: number; height?: number; caption?: string }) {
  const { url, width, height, caption } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: url,
    url,
    width,
    height,
    caption,
  };
}

export function webPageJsonLd(opts: { name: string; url: UrlString; description?: string; image?: UrlString; dateModified?: string; locale?: string }) {
  const { name, url, description, image, dateModified, locale } = opts;
  
  // Convert Market.defaultLocale to schema.org format
  let inLanguage = 'zh-TW'; // Default fallback
  if (locale === 'zh-Hant-HK') {
    inLanguage = 'zh-HK';
  } else if (locale === 'zh-Hant-TW') {
    inLanguage = 'zh-TW';
  } else if (locale) {
    inLanguage = locale;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url,
    description,
    primaryImageOfPage: image ? { '@type': 'ImageObject', contentUrl: image, url: image } : undefined,
    dateModified: dateModified ? toTaipeiIso(dateModified) : undefined,
    inLanguage,
  };
}

export function aggregateOfferJsonLd(opts: { url: UrlString; offers: Array<{ price?: number; validThrough?: string | null; status?: 'active' | 'expired' }> }) {
  const { url, offers } = opts;
  const active = offers.filter(o => o.status !== 'expired');
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    url,
    offerCount: active.length,
    lowPrice: undefined,
    highPrice: undefined,
    priceCurrency: 'TWD',
    offers: active.map(o => ({
      '@type': 'Offer',
      url,
      availability: 'https://schema.org/InStock',
      validThrough: toTaipeiIso(o.validThrough || undefined),
    })),
  };
}

export function siteNavigationJsonLd(items: Array<{ name: string; url: UrlString }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: items.map(i => i.name),
    url: items.map(i => i.url),
  };
}


