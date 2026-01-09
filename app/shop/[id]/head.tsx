import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl, getStartsAtFilterParams } from '@/lib/strapi.server';
import { breadcrumbJsonLd, organizationJsonLd, offersItemListJsonLd, faqPageJsonLd, howToJsonLd, webPageJsonLd, storeJsonLd, getDailyUpdatedTime } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer, getMarketLocale } from '@/lib/domain-config';
import { parseFAQsFromRichText, parseHowToFromRichText } from './schema-utils';

/**
 * Merchant JSON-LD goes in <head> (server-only) to avoid
 * any client/hydration duplication in GSC rendered HTML.
 */
export default async function Head({ params }: { params: { id: string } }) {
  // `head.tsx` should not depend on querystring; TW frontend is fixed market.
  const { id } = params;
  const marketKey = 'tw';

  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  const [merchantRes, couponsRes] = await Promise.all([
    strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs({
        'filters[page_slug][$eq]': id,
        'filters[market][key][$eq]': marketKey,
        'fields[0]': 'merchant_name',
        'fields[1]': 'page_slug',
        'fields[2]': 'summary',
        'fields[3]': 'site_url',
        'fields[4]': 'faqs',
        'fields[5]': 'how_to',
        'fields[6]': 'createdAt',
        'fields[7]': 'updatedAt',
        'populate[logo][fields][0]': 'url',
        'populate[market][fields][0]': 'key',
        'populate[market][fields][1]': 'defaultLocale',
      })}`,
      { revalidate: 43200, tag: `merchant-schema:${id}` }
    ),
    strapiFetch<{ data: any[] }>(
      `/api/coupons?${qs({
        'filters[merchant][page_slug][$eq]': id,
        'filters[market][key][$eq]': marketKey,
        ...getStartsAtFilterParams(),
        sort: 'priority:asc',
        'fields[0]': 'id',
        'fields[1]': 'documentId',
        'fields[2]': 'coupon_title',
        'fields[3]': 'value',
        'fields[4]': 'code',
        'fields[5]': 'expires_at',
        'fields[6]': 'description',
        'fields[7]': 'coupon_status',
      })}`,
      { revalidate: 43200, tag: `merchant-schema:${id}` }
    ),
  ]);

  const merchantData = merchantRes.data?.[0];
  if (!merchantData) return null;

  const marketLocale = merchantData.market?.defaultLocale || (await getMarketLocale(marketKey));

  const merchantSlug = merchantData.page_slug || id;
  const merchantUrl = `${siteUrl}/shop/${merchantSlug}`;
  const merchantId = `${merchantUrl}#merchant`;
  const siteOrgId = `${siteUrl}#organization`;

  const originalLogoUrl = merchantData.logo?.url ? absolutizeMedia(merchantData.logo.url) : null;
  const schemaLogo = originalLogoUrl ? rewriteImageUrl(originalLogoUrl, siteUrl) : undefined;

  const normalizeUrl = (url: string | undefined): string => {
    if (!url) return merchantUrl;
    if (!url.match(/^https?:\/\//i)) return `https://${url}`;
    return url;
  };

  const merchantOrg = organizationJsonLd({
    name: merchantData.merchant_name,
    url: normalizeUrl(merchantData.site_url),
    logo: schemaLogo,
    id: merchantId,
  });

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: '首頁', url: `${siteUrl}/` },
      { name: '商家', url: `${siteUrl}/shop` },
      { name: merchantData.merchant_name, url: merchantUrl },
    ],
    merchantUrl
  );

  const rawCoupons = couponsRes.data || [];
  const seen = new Set<string>();
  const activeCoupons = rawCoupons.filter((c: any) => {
    const primary = (c.id?.toString() || c.documentId?.toString() || '').toString();
    if (!primary) return false;
    if (seen.has(primary)) return false;
    seen.add(primary);
    return (c.coupon_status || 'active') === 'active';
  });

  const offersList = offersItemListJsonLd(
    activeCoupons.map((c: any, index: number) => ({
      value: c.value,
      title: c.coupon_title,
      code: c.code,
      status: c.coupon_status,
      expires_at: c.expires_at,
      url: `${merchantUrl}#coupon-active-${index + 1}`,
      description: c.description || undefined,
    })),
    merchantUrl
  );

  const parsedFAQs = parseFAQsFromRichText(merchantData.faqs);
  const faq = faqPageJsonLd(
    parsedFAQs.map((f: any) => ({ question: f.question, answer: f.answer })).filter((x: any) => x.question && x.answer),
    `${merchantUrl}#faq`
  );

  const parsedHowTo = parseHowToFromRichText(merchantData.how_to);
  const howTo = parsedHowTo.length
    ? howToJsonLd({
        name: `如何於${merchantData.merchant_name}使用優惠碼`,
        url: merchantUrl,
        steps: parsedHowTo.map((s: any) => ({ step: s.step, descriptions: s.descriptions || [] })),
        description: `了解如何在${merchantData.merchant_name}使用優惠碼，享受購物折扣。`,
        image: schemaLogo,
      })
    : undefined;

  const dailyUpdatedTime = getDailyUpdatedTime();
  const updatedTimeISO = dailyUpdatedTime.toISOString();

  const webPage = webPageJsonLd({
    name: merchantData.merchant_name,
    url: merchantUrl,
    description: merchantData.summary || undefined,
    image: schemaLogo,
    dateModified: updatedTimeISO,
    datePublished: merchantData.createdAt,
    locale: marketLocale,
    siteId: `${siteUrl}#website`,
    breadcrumbId: `${merchantUrl}#breadcrumb`,
    merchantId: merchantId,
    publisherId: siteOrgId,
  });

  // Avoid AggregateRating in Store schema (high risk for GSC issues)
  const store = storeJsonLd({
    name: merchantData.merchant_name,
    url: merchantUrl,
    image: schemaLogo,
    market: 'tw',
    id: `${merchantUrl}#store`,
  });

  const graphItems: any[] = [merchantOrg, webPage];
  if (offersList && offersList.itemListElement?.length > 0) graphItems.push(offersList);
  if (faq) graphItems.push(faq);

  const schemaGraph = { '@context': 'https://schema.org', '@graph': graphItems };

  return (
    <>
      <script id="jsonld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb, null, 0) }} />
      {store && <script id="jsonld-store" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(store, null, 0) }} />}
      <script id="jsonld-graph" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph, null, 0) }} />
      {howTo && <script id="jsonld-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo, null, 0) }} />}
    </>
  );
}

