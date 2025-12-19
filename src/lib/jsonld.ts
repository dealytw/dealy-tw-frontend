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

/**
 * Generate a consistent daily updated time (midnight 12-1am) that updates every day.
 * This ensures all updated time references match throughout the day.
 * The time is deterministic based on the date (same date = same time).
 */
export function getDailyUpdatedTime(): Date {
  // Get current Taiwan time
  const taiwanDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const year = taiwanDate.getFullYear();
  const month = taiwanDate.getMonth();
  const day = taiwanDate.getDate();
  
  // Use date as seed for consistent random minute (0-59) throughout the day
  // This creates a deterministic "random" time between 00:00-00:59
  const seed = year * 10000 + month * 100 + day;
  const randomMinute = seed % 60; // 0-59 minutes
  
  // Create date at midnight (00:00) with random minute (00:00-00:59) in Taiwan timezone
  // Format: YYYY-MM-DDTHH:mm:ss+08:00
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:${String(randomMinute).padStart(2, '0')}:00+08:00`;
  const taiwanUpdatedDate = new Date(dateStr);
  
  return taiwanUpdatedDate;
}

/**
 * Generate deterministic random rating count based on merchant name.
 * This ensures the same merchant always shows the same count.
 * Taobao merchants: 1000-1500 range
 * Other merchants: 20-200 range
 */
export function generateRatingCount(merchantName: string): number {
  // Simple hash function to convert merchant name to a number
  let hash = 0;
  for (let i = 0; i < merchantName.length; i++) {
    const char = merchantName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and normalize
  const normalizedHash = Math.abs(hash);
  
  // Check if merchant is Taobao (case insensitive)
  const isTaobao = merchantName.toLowerCase().includes('taobao') || merchantName.toLowerCase().includes('淘寶');
  
  if (isTaobao) {
    // Taobao: 1000-1500 range
    return 1000 + (normalizedHash % 501); // 501 = 1500 - 1000 + 1
  } else {
    // Others: 20-200 range
    return 20 + (normalizedHash % 181); // 181 = 200 - 20 + 1
  }
}

export function websiteJsonLd(opts: { 
  siteName: string; 
  siteUrl: UrlString; 
  searchUrl?: UrlString; 
  locale?: string;
  image?: UrlString;
  logo?: UrlString;
  description?: string;
  publisher?: string;
}) {
  const { siteName, siteUrl, searchUrl, locale, image, logo, description, publisher } = opts;
  
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
  // Enhanced fields (matching EverySaving format)
  if (image) {
    obj.image = image;
  }
  if (logo) {
    obj.logo = logo;
  }
  if (description) {
    obj.description = description;
  }
  if (publisher) {
    obj.publisher = publisher;
  }
  return obj;
}

export function organizationJsonLd(opts: { name: string; url: UrlString; logo?: UrlString; sameAs?: UrlString[]; id?: UrlString }) {
  const { name, url, logo, sameAs, id } = opts;
  const org: any = {
    '@context': 'https://schema.org',
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
    '@context': 'https://schema.org',
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

/**
 * Generate ItemList schema for popular merchants (homepage)
 * Matches HK format exactly
 */
export function popularMerchantsItemListJsonLd(
  merchants: Array<{ name: string; slug: string }>,
  listName: string,
  siteUrl: UrlString
) {
  if (!merchants || merchants.length === 0) return undefined;
  
  const items = merchants.map((merchant, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'WebPage',
      name: merchant.name,
      url: `${siteUrl}/shop/${merchant.slug}`,
    },
  }));
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListOrder: 'ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items,
  };
}

export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>, faqId?: UrlString) {
  if (!faqs?.length) return undefined;
  const faq: any = {
    '@context': 'https://schema.org',
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

export function howToJsonLd(opts: { 
  name: string; 
  url: UrlString;
  steps: Array<{ step: string; descriptions?: string[] }>;
  description?: string;
  image?: UrlString;
  totalTime?: string;
}) {
  const { name, url, steps, description, image, totalTime } = opts;
  if (!steps?.length) return undefined;
  
  const howTo: any = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, index) => {
      const stepId = `step-${index + 1}`;
      const stepUrl = `${url}#${stepId}`;
      return {
        '@type': 'HowToStep',
        url: stepUrl,
        text: s.step, // Use step title only, descriptions not needed in schema
      };
    }),
  };
  
  if (description) {
    howTo.description = description;
  }
  
  if (image) {
    howTo.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }
  
  if (totalTime) {
    howTo.totalTime = totalTime;
  }
  
  return howTo;
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

export function webPageJsonLd(opts: { name: string; url: UrlString; description?: string; image?: UrlString; dateModified?: string; datePublished?: string; locale?: string; siteId?: UrlString; breadcrumbId?: UrlString; merchantId?: UrlString; publisherId?: UrlString }) {
  const { name, url, description, image, dateModified, locale, siteId, breadcrumbId, merchantId, publisherId } = opts;
  
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
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
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
  
  if (publisherId) {
    page.publisher = { '@id': publisherId };
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


