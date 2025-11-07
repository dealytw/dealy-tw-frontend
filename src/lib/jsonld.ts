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
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
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

export function organizationJsonLd(opts: { name: string; url: UrlString; logo?: UrlString; sameAs?: UrlString[]; id?: UrlString }) {
  const { name, url, logo, sameAs, id } = opts;
  const org: any = {
    '@type': 'Organization',
    name,
    url,
  };
  if (id) {
    org['@id'] = id;
  }
  if (logo) {
    org.logo = logo;
  }
  if (sameAs && sameAs.length) {
    org.sameAs = sameAs;
  }
  return org;
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: UrlString }>, breadcrumbId?: UrlString) {
  const lastItem = items[items.length - 1];
  const breadcrumbUrl = breadcrumbId || lastItem?.url || '';
  
  // Return full structure with @context for standalone script tag (matching HK format)
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
  description?: string;
}>, listId?: UrlString) {
  const items = coupons.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'WebPage',
      name: c.title || c.value || '優惠', // Use coupon_title as name (from top)
      url: c.url || `${listId}#coupon-active-${i + 1}`,
      description: c.description || undefined, // Use description from coupon card
      ...(c.expires_at && { expires: c.expires_at.split('T')[0] }), // Format: YYYY-MM-DD
    },
  }));
  const list: any = {
    '@type': 'ItemList',
    name: '優惠一覽',
    itemListOrder: 'ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items,
  };
  if (listId) {
    list['@id'] = `${listId}#coupons`; // Use #coupons for proper referencing
  }
  return list;
}

export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>, faqId?: UrlString) {
  if (!faqs?.length) return undefined;
  const faq: any = {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  if (faqId) {
    faq['@id'] = faqId; // Use same slug, no #faq suffix
  }
  return faq;
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

export function webPageJsonLd(opts: { name: string; url: UrlString; description?: string; image?: UrlString; dateModified?: string; locale?: string; siteId?: UrlString; breadcrumbId?: UrlString; merchantId?: UrlString }) {
  const { name, url, description, image, dateModified, locale, siteId, breadcrumbId, merchantId } = opts;
  
  // Convert Market.defaultLocale to schema.org format
  let inLanguage = 'zh-TW'; // Default fallback
  if (locale === 'zh-Hant-HK') {
    inLanguage = 'zh-HK';
  } else if (locale === 'zh-Hant-TW') {
    inLanguage = 'zh-TW';
  } else if (locale) {
    inLanguage = locale;
  }
  
  const page: any = {
    '@type': 'WebPage',
    '@id': url,
    name,
    url,
    inLanguage,
  };
  
  if (description) {
    page.description = description;
  }
  
  if (image) {
    page.primaryImageOfPage = { '@type': 'ImageObject', contentUrl: image, url: image };
  }
  
  if (dateModified) {
    const modified = toTaipeiIso(dateModified);
    if (modified) {
      page.dateModified = modified;
    }
  }
  
  // Add datePublished if available (using createdAt)
  if (opts.datePublished) {
    const published = toTaipeiIso(opts.datePublished);
    if (published) {
      page.datePublished = published;
    }
  }
  
  if (siteId) {
    page.isPartOf = { '@id': siteId };
  }
  
  if (breadcrumbId) {
    page.breadcrumb = { '@id': breadcrumbId };
  }
  
  if (merchantId) {
    page.about = { '@id': merchantId };
  }
  
  return page;
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

export function storeJsonLd(opts: { 
  name: string; 
  url: UrlString; 
  image?: UrlString;
  ratingValue?: string;
  reviewCount?: string;
}) {
  const { name, url, image, ratingValue, reviewCount } = opts;
  
  const store: any = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name,
    url,
    image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Taiwan',
      addressRegion: 'Taiwan',
      addressCountry: 'TW',
    },
  };
  
  // Add aggregateRating only if rating data is provided
  if (ratingValue && reviewCount) {
    store.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    };
  }
  
  return store;
}


