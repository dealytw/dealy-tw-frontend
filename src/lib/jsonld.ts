// Minimal helpers to generate JSON-LD blocks used on pages.
// Keep objects serializable and compact for SEO.

type UrlString = string;

const TIME_ZONE = "Asia/Taipei";
const TIME_OFFSET = "+08:00";

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

function getHourInTimeZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit" });
  const parts = dtf.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return Number(hour || 0);
}

function getTimePartsInTimeZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

function stableDailyJitterMinutes(seed: string, y: number, m: number, d: number) {
  const s = `${seed}:${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 60;
}

function toTaipeiIso(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  // Convert to ISO then mark +08:00 to reflect Taiwan time
  const iso = d.toISOString();
  return iso.replace(/Z$/, '+08:00');
}

/**
 * Generate a consistent daily updated time (00:00–00:59).
 * Only flips to "today" after 01:00 local time.
 */
export function getDailyUpdatedTime(seed: string = "daily-updated-tw"): Date {
  const timeZone = TIME_ZONE;
  const now = new Date();
  const hourLocal = getHourInTimeZone(now, timeZone);
  const effectiveDate = hourLocal < 1 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  const { year, month, day } = getDatePartsInTimeZone(effectiveDate, timeZone);
  const randomMinute = stableDailyJitterMinutes(seed, year, month, day);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:${String(randomMinute).padStart(2, "0")}:00${TIME_OFFSET}`;
  return new Date(dateStr);
}

export function getDailyUpdatedTimeIso(seed: string = "daily-updated-tw"): string {
  const time = getDailyUpdatedTime(seed);
  const parts = getTimePartsInTimeZone(time, TIME_ZONE);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${TIME_OFFSET}`;
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
  
  // Keep full script+region inLanguage to match hreflang and <html lang>.
  // Accept both full and short forms as input.
  let inLanguage = 'zh-Hant-TW'; // Default fallback
  if (locale === 'zh-HK') inLanguage = 'zh-Hant-HK';
  else if (locale === 'zh-TW') inLanguage = 'zh-Hant-TW';
  else if (locale) inLanguage = locale;
  
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
  // Note: WebSite schema does not support 'logo' property - removed
  // Use 'image' property instead for site logo
  if (description) {
    obj.description = description;
  }
  // Note: publisher should be Organization/Person object, not string
  // Removed - use publisherId in webPageJsonLd instead
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

/**
 * Extract plain text from rich text (removes paragraph/children structure)
 */
function extractPlainText(richText: any): string | undefined {
  if (!richText) return undefined;
  if (typeof richText === 'string') {
    // If it's HTML string, strip tags
    return richText.replace(/<[^>]*>/g, '').trim() || undefined;
  }
  if (Array.isArray(richText)) {
    // Extract text from all blocks and children
    const extractText = (item: any): string => {
      if (typeof item === 'string') return item;
      if (item.text) return item.text;
      if (item.children && Array.isArray(item.children)) {
        return item.children.map(extractText).filter(Boolean).join(' ');
      }
      return '';
    };
    const text = richText.map(extractText).filter(Boolean).join(' ').trim();
    return text || undefined;
  }
  return undefined;
}

export function offersItemListJsonLd(coupons: Array<{
  value?: string;
  title?: string;
  code?: string | null;
  status?: 'active' | 'expired';
  expires_at?: string | null;
  url: UrlString;
  description?: string | any; // Can be string or rich text object
}>, listId?: UrlString) {
  const items = coupons.map((c, i) => {
    // Extract plain text from description (schema.org expects Text, not rich text structure)
    const plainDescription = extractPlainText(c.description);
    
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'WebPage',
        name: c.title || c.value || '優惠', // Use coupon_title as name
        url: c.url || `${listId}#coupon-active-${i + 1}`,
        ...(plainDescription && { description: plainDescription }), // Only include if we have plain text
        ...(c.expires_at && { expires: c.expires_at.split('T')[0] }), // Format: YYYY-MM-DD
      },
    };
  });
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
  
  // Keep full script+region inLanguage to match hreflang and <html lang>.
  // Accept both full and short forms as input.
  let inLanguage = 'zh-Hant-TW'; // Default fallback
  if (locale === 'zh-HK') inLanguage = 'zh-Hant-HK';
  else if (locale === 'zh-TW') inLanguage = 'zh-Hant-TW';
  else if (locale) inLanguage = locale;
  
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
  ratingValue?: number; // Schema.org requires number, not string
  reviewCount?: number; // Schema.org requires number, not string
  market?: string; // 'hk' or 'tw' - determines address location
  id?: UrlString; // Optional @id to prevent duplicates
}) {
  const { name, url, image, ratingValue, reviewCount, market, id } = opts;
  
  // Determine address based on market (default to TW for TW frontend)
  const isHK = market && market.toLowerCase() === 'hk';
  const addressLocality = isHK ? 'Hong Kong' : 'Taiwan';
  const addressRegion = isHK ? 'Hong Kong SAR' : 'Taiwan';
  const addressCountry = isHK ? 'HK' : 'TW';
  
  const store: any = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name,
    url,
    image,
    address: {
      '@type': 'PostalAddress',
      addressLocality,
      addressRegion,
      addressCountry,
    },
  };
  
  // Add @id to prevent duplicates (if provided)
  if (id) {
    store['@id'] = id;
  }
  
  // Add aggregateRating only if rating data is provided
  // Schema.org requires ratingValue and reviewCount to be numbers
  if (ratingValue !== undefined && reviewCount !== undefined) {
    store.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingValue), // Ensure it's a number
      reviewCount: Number(reviewCount), // Ensure it's a number
    };
  }
  
  return store;
}


