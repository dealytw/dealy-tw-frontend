import { notFound } from 'next/navigation';
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl, getStartsAtFilterParams } from '@/lib/strapi.server';
import { pageMeta, extractUrlFromRichText } from '@/seo/meta';
import { getMerchantSEO } from '@/lib/seo.server';
import Merchant from './page-client'; // Merchant page component
import { breadcrumbJsonLd, organizationJsonLd, offersItemListJsonLd, faqPageJsonLd, howToJsonLd, webPageJsonLd, imageObjectJsonLd, aggregateOfferJsonLd, storeJsonLd, websiteJsonLd, getDailyUpdatedTime, generateRatingCount } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer, getMarketLocale } from '@/lib/domain-config';

/**
 * Parse FAQs from rich text (HTML format)
 * Extracts H3 headings as questions and following text as answers
 * Removes leading "?" from questions but keeps emoji
 */
function parseFAQsFromRichText(richText: any): Array<{ question: string; answer: string }> {
  if (!richText) return [];
  
  // If richText is already an array of parsed FAQs, return as-is
  if (Array.isArray(richText) && richText.length > 0 && typeof richText[0] === 'object' && ('question' in richText[0] || 'q' in richText[0])) {
    return richText.map((f: any) => {
      let question = f?.question || f?.q || '';
      // Clean question text (remove leading ?)
      question = cleanQuestionText(question);
      
      return {
        question,
        answer: f?.answer || f?.a || ''
      };
    }).filter((f: any) => f.question && f.answer);
  }
  
  // If richText is Strapi blocks format (JSON array)
  if (Array.isArray(richText)) {
    const faqs: Array<{ question: string; answer: string }> = [];
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const block of richText) {
      // Check if it's a heading block with level 3 (H3) only
      if (block.type === 'heading' && block.level === 3) {
        // Save previous FAQ if exists
        if (currentQuestion && currentAnswer) {
          faqs.push({
            question: currentQuestion.trim(),
            answer: currentAnswer.trim()
          });
        }
        // Extract text from heading children and clean it (remove leading ?)
        const rawQuestion = extractTextFromBlock(block);
        currentQuestion = cleanQuestionText(rawQuestion);
        currentAnswer = '';
      } else if (currentQuestion) {
        // Convert block to HTML to preserve list structure
        const html = blockToHTML(block);
        if (html) {
          if (currentAnswer) {
            currentAnswer += html;
          } else {
            currentAnswer = html;
          }
        }
      }
    }
    
    // Don't forget the last FAQ
    if (currentQuestion && currentAnswer) {
      faqs.push({
        question: currentQuestion.trim(),
        answer: currentAnswer.trim()
      });
    }
    
    return faqs;
  }
  
  // If richText is HTML string, parse it
  if (typeof richText === 'string') {
    return parseFAQsFromHTML(richText);
  }
  
  return [];
}

/**
 * Extract text content from a Strapi block (for questions only)
 */
function extractTextFromBlock(block: any): string {
  if (!block || !block.children) return '';
  
  return block.children
    .map((child: any) => {
      if (child.text) return child.text;
      if (child.type === 'text') return child.text || '';
      if (child.children) return extractTextFromBlock(child);
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Extract first H2 heading from rich text blocks
 * Returns the text content of the first H2 heading found
 */
function extractFirstH2Title(richText: any): string | null {
  if (!richText) return null;
  
  // If richText is Strapi blocks format (JSON array)
  if (Array.isArray(richText)) {
    for (const block of richText) {
      if (block.type === 'heading' && block.level === 2) {
        return extractTextFromBlock(block);
      }
    }
  }
  
  // If richText is HTML string, parse it
  if (typeof richText === 'string') {
    const h2Match = richText.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (h2Match) {
      // Strip HTML tags from the match
      return h2Match[1].replace(/<[^>]*>/g, '').trim();
    }
  }
  
  return null;
}

/**
 * Convert Strapi block to HTML, preserving list structure
 */
function blockToHTML(block: any): string {
  if (!block) return '';
  
  // Process children to extract text with formatting
  const processChildren = (children: any[]): string => {
    if (!children || !Array.isArray(children)) return '';
    
    return children.map((child: any) => {
      if (child.type === 'text') {
        let text = child.text || '';
        // Apply formatting
        if (child.bold) text = `<strong>${text}</strong>`;
        if (child.italic) text = `<em>${text}</em>`;
        if (child.code) text = `<code>${text}</code>`;
        if (child.strikethrough) text = `<s>${text}</s>`;
        if (child.underline) text = `<u>${text}</u>`;
        return text;
      }
      if (child.type === 'link') {
        const linkText = processChildren(child.children || []);
        return `<a href="${child.url || '#'}">${linkText}</a>`;
      }
      if (child.children) {
        return processChildren(child.children);
      }
      return '';
    }).join('');
  };
  
  // Handle different block types
  if (block.type === 'paragraph') {
    const content = processChildren(block.children || []);
    return `<p>${content || '<br>'}</p>`;
  }
  
  if (block.type === 'heading') {
    const level = block.level || 2;
    const content = processChildren(block.children || []);
    return `<h${level}>${content}</h${level}>`;
  }
  
  if (block.type === 'list') {
    const isOrdered = block.format === 'ordered';
    const items = (block.children || []).map((item: any) => {
      const content = processChildren(item.children || []);
      return `<li>${content}</li>`;
    }).join('');
    return isOrdered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
  }
  
  // Fallback: extract text
  return extractTextFromBlock(block);
}

/**
 * Clean question text by removing leading "?" or ":?"
 * Keeps emoji in the text
 */
function cleanQuestionText(text: string): string {
  if (!text) return '';
  // Remove leading "?" or ":?" but keep everything else including emoji
  return text.replace(/^[:\?]+\s*/, '').trim();
}

/**
 * Parse FAQs from HTML string
 * Extracts H3 headings as questions and following content as answers
 * Preserves list HTML structure (ul, ol, li)
 */
function parseFAQsFromHTML(html: string): Array<{ question: string; answer: string }> {
  if (!html || typeof html !== 'string') return [];
  
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Match H3 tags and their following content
  // Pattern: <h3>question</h3> followed by content until next <h3> or end
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  const matches = Array.from(html.matchAll(h3Pattern));
  
  if (matches.length === 0) return [];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const questionStart = match.index!;
    const questionEnd = questionStart + match[0].length;
    const rawQuestion = stripHTMLTags(match[1]).trim();
    // Clean question text (remove leading ?)
    const question = cleanQuestionText(rawQuestion);
    
    // Find the answer (content after H3 until next H3 or end)
    const nextMatch = matches[i + 1];
    const answerEnd = nextMatch ? nextMatch.index! : html.length;
    let answerHTML = html.substring(questionEnd, answerEnd).trim();
    
    // Clean up the answer HTML but preserve list tags
    // Remove leading/trailing whitespace and normalize
    answerHTML = answerHTML
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
    
    // Only add if we have both question and answer content
    if (question && answerHTML) {
      faqs.push({ question, answer: answerHTML });
    }
  }
  
  return faqs;
}

/**
 * Strip HTML tags from a string, preserving text content
 */
function stripHTMLTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags but preserve text content
  // Replace <br>, <p>, etc. with spaces
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/?[^>]+>/g, '') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Parse How-To guide from rich text
 * Extracts bold text as steps and bulleted list items as descriptions
 */
function parseHowToFromRichText(richText: any): Array<{ step: string; descriptions: string[] }> {
  if (!richText) return [];
  
  // If richText is already an array of parsed how-to items, return as-is
  if (Array.isArray(richText) && richText.length > 0 && typeof richText[0] === 'object' && ('step' in richText[0] || 'title' in richText[0])) {
    return richText.map((item: any) => ({
      step: item?.step || item?.title || '',
      descriptions: Array.isArray(item?.descriptions) ? item.descriptions : 
                   (item?.content ? [item.content] : [])
    })).filter((item: any) => item.step);
  }
  
  // If richText is Strapi blocks format (JSON array)
  if (Array.isArray(richText)) {
    const howToSteps: Array<{ step: string; descriptions: string[] }> = [];
    let currentStep = '';
    let currentDescriptions: string[] = [];
    
    for (const block of richText) {
      // Check if it's a paragraph with bold text (step)
      if (block.type === 'paragraph') {
        const hasBold = block.children?.some((child: any) => child.bold);
        
        if (hasBold) {
          // Save previous step if exists
          if (currentStep && currentDescriptions.length > 0) {
            howToSteps.push({
              step: currentStep.trim(),
              descriptions: currentDescriptions
            });
          }
          // Extract bold text as step title
          currentStep = extractBoldTextFromBlock(block);
          currentDescriptions = [];
        } else if (currentStep) {
          // Regular paragraph text - add to descriptions
          const text = extractTextFromBlock(block);
          if (text) {
            currentDescriptions.push(text);
          }
        }
      } else if (block.type === 'list' && currentStep) {
        // Handle bulleted list items as descriptions
        const listItems = extractListItemsFromBlock(block);
        currentDescriptions.push(...listItems);
      } else if (block.type === 'heading' && block.level === 3 && currentStep) {
        // H3 might be a step separator - save current and start new
        if (currentStep && currentDescriptions.length > 0) {
          howToSteps.push({
            step: currentStep.trim(),
            descriptions: currentDescriptions
          });
        }
        currentStep = extractTextFromBlock(block);
        currentDescriptions = [];
      }
    }
    
    // Don't forget the last step
    if (currentStep && currentDescriptions.length > 0) {
      howToSteps.push({
        step: currentStep.trim(),
        descriptions: currentDescriptions
      });
    }
    
    return howToSteps;
  }
  
  // If richText is HTML string, parse it
  if (typeof richText === 'string') {
    return parseHowToFromHTML(richText);
  }
  
  return [];
}

/**
 * Extract bold text from a block (for step titles)
 */
function extractBoldTextFromBlock(block: any): string {
  if (!block || !block.children) return '';
  
  return block.children
    .filter((child: any) => child.bold)
    .map((child: any) => child.text || '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Extract list items from a list block
 */
function extractListItemsFromBlock(block: any): string[] {
  if (!block || !block.children) return [];
  
  const items: string[] = [];
  
  for (const listItem of block.children) {
    if (listItem.children) {
      const text = listItem.children
        .map((child: any) => {
          if (child.text) return child.text;
          if (child.children) {
            return child.children.map((c: any) => c.text || '').join('');
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      
      if (text) {
        items.push(text.trim());
      }
    }
  }
  
  return items;
}

/**
 * Parse How-To from HTML string
 */
function parseHowToFromHTML(html: string): Array<{ step: string; descriptions: string[] }> {
  if (!html || typeof html !== 'string') return [];
  
  const steps: Array<{ step: string; descriptions: string[] }> = [];
  
  // Match ordered list items (<ol><li>) or paragraphs with bold text
  // Pattern: <li> or <p> containing <strong> or <b> followed by <ul> or <p> with text
  // NOTE: Avoid /s (dotAll) flag so we don't require ES2018 target
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const matches = Array.from(html.matchAll(liPattern));
  
  for (const match of matches) {
    const liContent = match[1];
    
    // Extract bold text (step)
    const boldMatch = liContent.match(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/i);
    const step = boldMatch ? stripHTMLTags(boldMatch[1]).trim() : '';
    
    if (!step) continue;
    
    // Extract descriptions (bullet points or text after bold)
    const descriptions: string[] = [];
    
    // Look for nested <ul> or text after bold
    const afterBold = liContent.replace(/<(?:strong|b)[^>]*>.*?<\/(?:strong|b)>/i, '');
    const ulMatch = afterBold.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    
    if (ulMatch) {
      // Extract list items from nested ul
      const nestedLiPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const nestedMatches = Array.from(ulMatch[1].matchAll(nestedLiPattern));
      nestedMatches.forEach(nestedMatch => {
        const text = stripHTMLTags(nestedMatch[1]).trim();
        if (text) descriptions.push(text);
      });
    } else {
      // Extract text after bold as description
      const text = stripHTMLTags(afterBold).trim();
      if (text) descriptions.push(text);
    }
    
    if (step && descriptions.length > 0) {
      steps.push({ step, descriptions });
    }
  }
  
  return steps;
}

// ISR Configuration - Critical for SEO
export const revalidate = 43200; // Revalidate every 12 hours - merchant pages don't change frequently
export const dynamic = 'force-static'; // Force static ISR to ensure cacheable HTML

// Expected: max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = 'tw'; // Hardcoded for TW market
  const marketKey = 'tw';
  
  try {
    // Fetch merchant with SEO fields (without populate to keep flat format)
    const res = await getMerchantSEO(id, 300);
    const merchant = res.data?.[0];

    if (!merchant) {
      notFound();
    }

    // Fetch ogImage and logo separately (with populate) - keep this separate to avoid breaking title/description
    // This keeps getMerchantSEO response in flat format while still getting images
    let merchantLogo: any = null;
    let merchantOgImage: any = null;
    
    try {
      const imageRes = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
        'filters[page_slug][$eq]': id,
        'fields[0]': 'id',
        'populate[ogImage][fields][0]': 'url',
        'populate[logo][fields][0]': 'url',
      })}`, {
        revalidate: 43200, // Cache for 12 hours - merchant images don't change frequently
        tag: `merchant-images:${id}`
      });
      
      const imageMerchant = imageRes.data?.[0];
      if (imageMerchant) {
        // Extract ogImage and logo from populated response
        const getPopulatedField = (fieldName: string) => {
          const attrField = imageMerchant.attributes?.[fieldName];
          const rootField = imageMerchant[fieldName];
          
          if (attrField?.data) {
            return Array.isArray(attrField.data) ? attrField.data[0] : attrField.data;
          }
          if (attrField) return attrField;
          
          if (rootField?.data) {
            return Array.isArray(rootField.data) ? rootField.data[0] : rootField.data;
          }
          return rootField || null;
        };
        
        // Inject ogImage and logo into merchant object
        merchantOgImage = getPopulatedField('ogImage');
        merchantLogo = getPopulatedField('logo');
      }
    } catch (imageError) {
      // If image fetch fails, continue without images (non-critical)
      console.warn(`[generateMetadata] Failed to fetch images for ${id}:`, imageError);
    }
    
    // Fetch categories and updatedAt separately (with populate) - keep this separate to avoid breaking title/description
    let firstCategoryName: string | null = null;
    let merchantUpdatedAt: string | null = null;
    
    try {
      const categoryRes = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
        'filters[page_slug][$eq]': id,
        'fields[0]': 'id',
        'fields[1]': 'updatedAt',
        'populate[categories][fields][0]': 'name',
        'populate[categories][fields][1]': 'page_slug',
      })}`, {
        revalidate: 43200, // Cache for 12 hours - merchant categories don't change frequently
        tag: `merchant-categories:${id}`
      });
      
      const categoryMerchant = categoryRes.data?.[0];
      if (categoryMerchant) {
        // Extract categories
        const getCategories = () => {
          const attrCategories = categoryMerchant.attributes?.categories;
          const rootCategories = categoryMerchant.categories;
          
          let categories = null;
          if (attrCategories?.data) {
            categories = Array.isArray(attrCategories.data) ? attrCategories.data : [attrCategories.data];
          } else if (rootCategories?.data) {
            categories = Array.isArray(rootCategories.data) ? rootCategories.data : [rootCategories.data];
          } else if (Array.isArray(attrCategories)) {
            categories = attrCategories;
          } else if (Array.isArray(rootCategories)) {
            categories = rootCategories;
          }
          
          return categories || [];
        };
        
        // Get first category name for article:section
        const categories = getCategories();
        if (categories.length > 0) {
          firstCategoryName = categories[0]?.name || categories[0]?.attributes?.name || null;
        }
        
        // Get updatedAt
        merchantUpdatedAt = categoryMerchant.attributes?.updatedAt || categoryMerchant.updatedAt || null;
      }
    } catch (categoryError) {
      // If category fetch fails, continue without category (non-critical)
      console.warn(`[generateMetadata] Failed to fetch categories for ${id}:`, categoryError);
    }

    // Extract merchant_name - handle both Strapi v5 attributes format and flat format (supports Chinese characters)
    const name = (merchant.attributes?.merchant_name || merchant.merchant_name || id).trim();
    
    // Use plain text hreflang_alternate_url (comma-separated URLs)
    const alternateUrl = merchant.attributes?.hreflang_alternate_url || merchant.hreflang_alternate_url || null;
    
    if (alternateUrl) {
      console.log(`[generateMetadata] ✅ Found alternate URL for merchant "${id}": ${alternateUrl}`);
    } else {
      console.log(`[generateMetadata] No alternate URL found for merchant "${id}" (hreflang_alternate field is empty or null)`);
    }
    let title: string;
    let description: string;

    // Check if CMS has override values
    if (merchant.seo_title && merchant.seo_description) {
      // Use CMS override values
      title = merchant.seo_title;
      description = merchant.seo_description;
    } else {
      // Auto-generate from coupons
      const { getFirstCouponHighlights, getFirstValidCoupon, generateMerchantMetaTitle, generateMerchantMetaDescription } = await import('@/lib/seo-generation');
      const { getMerchantCouponsForSEO } = await import('@/lib/seo.server');
      
      // Fetch ACTIVE coupons for this merchant (sorted by priority)
      const couponsRes = await getMerchantCouponsForSEO(merchant.documentId, market, 300);
      const coupons = couponsRes?.data || [];
      
      // Generate highlights and first coupon
      const highlights = getFirstCouponHighlights(coupons, name);
      const firstCoupon = getFirstValidCoupon(coupons);
      
      // Extract highlight for description
      // Format from highlights: "最省 4折 & 新客優惠 & 免運費"
      let highlight = '';
      if (highlights.includes('新客優惠')) {
        highlight = '新客優惠';
      } else if (highlights.includes('免運費')) {
        highlight = '免運費';
      } else if (highlights.includes('會員優惠')) {
        highlight = '會員優惠';
      } else if (highlights) {
        // Extract first value after "最省" (e.g., "最省 4折 & ...")
        const valueMatch = highlights.match(/最省\s*([^&]+)/);
        if (valueMatch) {
          highlight = valueMatch[1].trim();
        }
      }
      
      // Generate meta tags
      title = generateMerchantMetaTitle(name, highlights);
      description = generateMerchantMetaDescription(name, firstCoupon?.coupon_title || '限時優惠', highlight);
    }

    const noindex = merchant.robots === 'noindex,nofollow' || merchant.robots === 'noindex';

    // Get site URL for image rewriting
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

    // Process OG image: use logo (for trip.com, use specific URL, otherwise use merchant logo)
    let ogImageUrl: string | undefined = undefined;
    if (id.toLowerCase() === 'trip.com' || id.toLowerCase() === 'tripcom') {
      // Special case for trip.com
      ogImageUrl = 'https://dealy.tw/upload/tripcom_5eff0330bd.webp';
    } else if (merchantLogo?.url) {
      // Use merchant logo for og:image
      const absoluteLogo = absolutizeMedia(merchantLogo.url);
      ogImageUrl = rewriteImageUrl(absoluteLogo, siteUrl);
    } else if (merchantOgImage?.url) {
      // Fallback to ogImage if logo is not available
      const absoluteOgImage = absolutizeMedia(merchantOgImage.url);
      ogImageUrl = rewriteImageUrl(absoluteOgImage, siteUrl);
    }
    
    // Fallback to default OG image if no merchant image available
    if (!ogImageUrl) {
      ogImageUrl = `${siteUrl}/og-image.png`; // Match HK fallback asset
      console.warn(`[generateMetadata] No OG image found for ${id}, using fallback`);
    } else {
      console.log(`[generateMetadata] OG image for ${id}:`, ogImageUrl);
    }

    // Format ogImageAlt as "{merchant name}優惠碼"
    const ogImageAlt = `${name}優惠碼`;

    return pageMeta({
      title,
      description,
      path: `/shop/${id}`,
      canonicalOverride: merchant.canonical_url || undefined,
      noindex,
      ogImageUrl,
      ogImageAlt,
      ogType: 'article', // Change from 'website' to 'article' for merchant pages
      alternateUrl, // Pass alternate URL(s) from CMS hreflang_alternate_url field
      ogUpdatedTime: (() => {
        // Use the same daily updated time function to ensure consistency
        const dailyTime = getDailyUpdatedTime();
        // Format as ISO string for og:updated_time
        return dailyTime.toISOString();
      })(),
      articleSection: firstCategoryName || undefined, // Pass first category name for article:section
    });
      } catch (error) {
    console.error('Error generating metadata:', error);
    notFound();
  }
}

interface MerchantPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MerchantPage({ params, searchParams }: MerchantPageProps) {
  const { id } = await params;
  const { market } = await searchParams;
  
  const marketKey = (market as string) || 'tw'; // Hardcoded for TW frontend

  // Get siteUrl early for use in related merchants section
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

  try {
    // Use server-only Strapi fetch with ISR
    const [merchantRes, couponsRes, hotstoreRes] = await Promise.all([
      // Fetch merchant data with ISR (including related_merchants for manyToMany)
      strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
        "filters[page_slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        "fields[0]": "merchant_name",
        "fields[1]": "page_slug",
        "fields[2]": "location_filtering",
        "fields[3]": "creditcard_filtering",
        "fields[4]": "summary",
        "fields[5]": "page_title_h1",
        "fields[6]": "site_url",
        "fields[7]": "store_description",
        "fields[8]": "faqs",
        "fields[9]": "how_to",
        "fields[10]": "small_blog_section",
        "fields[11]": "createdAt",
        "fields[12]": "updatedAt",
        "fields[13]": "hreflang_alternate_url",
        "populate[logo][fields][0]": "url",
        "populate[how_to_image][fields][0]": "url",
        "populate[useful_links][fields][0]": "link_title",
        "populate[useful_links][fields][1]": "url",
        "populate[related_merchants][fields][0]": "id",
        "populate[related_merchants][fields][1]": "merchant_name",
        "populate[related_merchants][fields][2]": "page_slug",
        "populate[related_merchants][populate][logo][fields][0]": "url",
        "populate[special_offers][fields][0]": "id",
        "populate[special_offers][fields][1]": "title",
        "populate[special_offers][fields][2]": "page_slug",
        "populate[related_blogs][fields][0]": "id",
        "populate[related_blogs][fields][1]": "blog_title",
        "populate[related_blogs][fields][2]": "page_slug",
        "populate[market][fields][0]": "key",
        "populate[market][fields][1]": "defaultLocale",
      })}`, { 
        revalidate: 43200, // Cache for 12 hours - merchant data doesn't change frequently
        tag: `merchant:${id}` 
      }),
      // Fetch coupons data with ISR (include display_count for usage tracking)
      strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
        "filters[merchant][page_slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        ...getStartsAtFilterParams(), // Filter out scheduled coupons (starts_at in the future)
        "sort": "priority:asc",
        "fields[0]": "id",
        "fields[1]": "documentId",
        "fields[2]": "coupon_title",
        "fields[3]": "value",
        "fields[4]": "code",
        "fields[5]": "expires_at",
        "fields[6]": "affiliate_link",
        "fields[7]": "coupon_type",
        "fields[8]": "description",
        "fields[9]": "editor_tips",
        "fields[10]": "priority",
        "fields[11]": "display_count",
        "fields[12]": "coupon_status",
        "populate[merchant][fields][0]": "id",
        "populate[merchant][fields][1]": "merchant_name",
        "populate[merchant][fields][2]": "page_slug",
        "populate[merchant][populate][logo][fields][0]": "url",
        "populate[market][fields][0]": "key",
        "populate[market][fields][1]": "defaultLocale",
      })}`, { 
        revalidate: 43200, // Cache for 12 hours - merchant coupons don't change frequently
        tag: `merchant:${id}` 
      }),
      // Fetch hotstore data for popular merchants section
      strapiFetch<{ data: any[] }>(`/api/hotstores?${qs({
        "filters[market][key][$eq]": marketKey,
        "populate[merchants][fields][0]": "id",
        "populate[merchants][fields][1]": "merchant_name",
        "populate[merchants][fields][2]": "page_slug",
        "populate[merchants][populate][logo][fields][0]": "url",
      })}`, { 
        revalidate: 300, // 5 minutes - temporarily reduced for debugging, will change back to 15552000 (6 months) after verification
        tag: `hotstore:${marketKey}` 
      })
    ]);

    // Extract related merchants from the merchant data already fetched
    let relatedMerchants: any[] = [];
    try {
      const merchant = merchantRes.data?.[0];
      
      // Handle all possible formats for manyToMany relation:
      // 1. Direct array: [{ id, ... }]
      // 2. With data wrapper: { data: [{ id, ... }] }
      // 3. Nested: [{ data: { id, ... } }]
      let relatedFromCMS = [];
      if (Array.isArray(merchant?.related_merchants)) {
        // Check if it's nested format
        if (merchant.related_merchants[0]?.data) {
          relatedFromCMS = merchant.related_merchants.map((item: any) => item.data || item);
        } else {
          relatedFromCMS = merchant.related_merchants;
        }
      } else if (merchant?.related_merchants?.data) {
        relatedFromCMS = merchant.related_merchants.data;
      }
      
      if (relatedFromCMS.length > 0) {
        // Fetch priority 1 coupon for each related merchant
        const relatedMerchantsWithCoupons = await Promise.all(
          relatedFromCMS.map(async (relatedMerchant: any) => {
            try {
              const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
                "filters[merchant][id][$eq]": relatedMerchant.id.toString(),
                "filters[market][key][$eq]": marketKey,
                "filters[coupon_status][$eq]": "active",
                "sort": "priority:asc",
                "pagination[pageSize]": "1",
              })}`, { 
                revalidate: 43200, // Cache for 12 hours - related merchant coupons don't change frequently
                tag: `merchant:${relatedMerchant.page_slug}` 
              });
              
              const firstCoupon = couponData?.data?.[0] || null;
              
              const originalLogoUrl = relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null;
              const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl, siteUrl) : null;
              
              return {
                id: relatedMerchant.id.toString(),
                name: relatedMerchant.merchant_name || relatedMerchant.name,
                slug: relatedMerchant.page_slug,
                logo: rewrittenLogoUrl,
                firstCoupon: firstCoupon ? {
                  id: firstCoupon.id.toString(),
                  title: firstCoupon.coupon_title,
                  value: firstCoupon.value?.replace('$$', '$') || firstCoupon.value,
                  code: firstCoupon.code,
                  coupon_type: firstCoupon.coupon_type,
                  affiliate_link: firstCoupon.affiliate_link,
                  priority: firstCoupon.priority
                } : null
              };
            } catch (error) {
              console.error(`Error fetching coupon for merchant ${relatedMerchant.page_slug}:`, error);
              const originalLogoUrl = relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null;
              const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl, siteUrl) : null;
              return {
                id: relatedMerchant.id.toString(),
                name: relatedMerchant.merchant_name || relatedMerchant.name,
                slug: relatedMerchant.page_slug,
                logo: rewrittenLogoUrl,
                firstCoupon: null
              };
            }
          })
        );
        
        relatedMerchants = relatedMerchantsWithCoupons;
      }
      } catch (error) {
      console.warn('Failed to fetch related merchants, continuing without them:', error);
      relatedMerchants = [];
    }

    if (!merchantRes.data || merchantRes.data.length === 0) {
      notFound();
    }

    const merchantData = merchantRes.data[0];
    const allCouponsRaw = couponsRes.data || [];
    
    // Remove duplicate coupons by ID to prevent duplicate rendering in HTML
    // Use Map to keep only the first occurrence of each coupon ID
    // Check both id and documentId to ensure proper deduplication
    const uniqueCouponsMap = new Map<string, any>();
    const seenIds = new Set<string>();
    for (const coupon of allCouponsRaw) {
      // Try both id and documentId for deduplication
      const couponId = coupon.id?.toString();
      const couponDocumentId = coupon.documentId?.toString();
      
      // Use the first available ID for the map key
      const primaryId = couponId || couponDocumentId;
      
      if (!primaryId) {
        console.warn('Skipping coupon without id or documentId:', coupon);
        continue;
      }
      
      // Check if we've seen this coupon by either id or documentId
      if (seenIds.has(primaryId) || (couponId && seenIds.has(couponId)) || (couponDocumentId && seenIds.has(couponDocumentId))) {
        console.warn('Skipping duplicate coupon:', { id: couponId, documentId: couponDocumentId, title: coupon.coupon_title });
        continue;
      }
      
      // Mark both IDs as seen
      if (couponId) seenIds.add(couponId);
      if (couponDocumentId) seenIds.add(couponDocumentId);
      
      uniqueCouponsMap.set(primaryId, coupon);
    }
    const allCoupons = Array.from(uniqueCouponsMap.values());
    
    // Get market locale from merchant data or fetch separately
    const marketLocale = merchantData.market?.defaultLocale || await getMarketLocale(marketKey);

    // Get Taiwan time (UTC+8) for server-side date generation
    const getTaiwanDate = () => {
      return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    };
    
    
    // Generate H1 title on server-side
    const taiwanDate = getTaiwanDate();
    const currentYear = taiwanDate.getFullYear();
    const currentMonth = taiwanDate.getMonth() + 1;
    const generatedH1 = `${merchantData.merchant_name}折扣碼及優惠${currentYear}｜${currentMonth}月最新折扣與信用卡優惠`;
    const h1Title = merchantData.page_title_h1 || generatedH1;
    
    // Get daily updated time (consistent throughout the day)
    const dailyUpdatedTime = getDailyUpdatedTime();
    
    // Format last updated date for server-side display
    const lastUpdatedDate = dailyUpdatedTime.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
    
    // Format updated time as ISO string for schema and meta tags
    const updatedTimeISO = dailyUpdatedTime.toISOString();

    // Rewrite logo URL to custom domain (for both client component and schema)
    const originalLogoUrl = merchantData.logo?.url ? absolutizeMedia(merchantData.logo.url) : null;
    const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl, siteUrl) : null;
    
    // Process how_to_image (can be single image or array)
    let howToImages: string[] = [];
    if (merchantData.how_to_image) {
      const images = Array.isArray(merchantData.how_to_image) ? merchantData.how_to_image : [merchantData.how_to_image];
      howToImages = images
        .map((img: any) => {
          const url = img?.url || img?.data?.url || img;
          if (url && typeof url === 'string') {
            const absoluteUrl = absolutizeMedia(url);
            return rewriteImageUrl(absoluteUrl, siteUrl);
          }
          return null;
        })
        .filter((url: string | null): url is string => url !== null);
    }

    // Parse FAQs from rich text (server-side)
    const parsedFAQs = parseFAQsFromRichText(merchantData.faqs);

    // Use plain text hreflang_alternate_url (comma-separated URLs)
    const alternateUrl = merchantData.attributes?.hreflang_alternate_url || merchantData.hreflang_alternate_url || null;

    // Transform merchant data to match frontend structure
    const merchant = {
      id: merchantData.id,
      name: merchantData.merchant_name,
      slug: merchantData.page_slug,
      logo: rewrittenLogoUrl,
      description: merchantData.summary || "", // Keep for backward compatibility, but use store_description for display
      store_description: merchantData.store_description || null, // Rich text blocks (JSON array)
      faqs: parsedFAQs,
      how_to: parseHowToFromRichText(merchantData.how_to),
      how_to_image: howToImages,
      useful_links: merchantData.useful_links || [],
      website: merchantData.website || "",
      site_url: merchantData.site_url || "",
      affiliateLink: merchantData.affiliate_link || "",
      pageLayout: merchantData.page_layout || "coupon",
      isFeatured: merchantData.is_featured || false,
      market: merchantData.market?.key || marketKey.toUpperCase(),
      seoTitle: merchantData.seo_title || "",
      seoDescription: merchantData.seo_description || "",
      canonicalUrl: merchantData.canonical_url || "",
      priority: merchantData.priority || 0,
      robots: merchantData.robots || "index,follow",
      createdAt: merchantData.createdAt,
      updatedAt: merchantData.updatedAt,
      publishedAt: merchantData.publishedAt,
      relatedMerchants: relatedMerchants,
      location_filtering: merchantData.location_filtering ?? false,
      creditcard_filtering: merchantData.creditcard_filtering ?? false,
      page_title_h1: merchantData.page_title_h1 || null,
      h1Title: h1Title, // Pre-generated H1 title from server
      lastUpdatedDate: lastUpdatedDate, // Pre-formatted date from server
      lastUpdatedDateISO: updatedTimeISO, // ISO date string for <time datetime>
      special_offers: (() => {
        // Handle different formats for manyToMany relation (same as related_merchants)
        let specialOffersFromCMS = [];
        if (Array.isArray(merchantData.special_offers)) {
          // Check if it's nested format
          if (merchantData.special_offers[0]?.data) {
            specialOffersFromCMS = merchantData.special_offers.map((item: any) => item.data || item);
          } else {
            specialOffersFromCMS = merchantData.special_offers;
          }
        } else if (merchantData.special_offers?.data) {
          specialOffersFromCMS = merchantData.special_offers.data;
        }
        
        // Transform to the format needed by client component
        return specialOffersFromCMS.map((so: any) => ({
          id: so.id,
          title: so.title,
          slug: so.page_slug,
          type: 'special_offer', // Mark as special offer
        }));
      })(),
      related_blogs: (() => {
        // Handle different formats for manyToMany relation (same as related_merchants)
        let relatedBlogsFromCMS = [];
        if (Array.isArray(merchantData.related_blogs)) {
          // Check if it's nested format
          if (merchantData.related_blogs[0]?.data) {
            relatedBlogsFromCMS = merchantData.related_blogs.map((item: any) => item.data || item);
          } else {
            relatedBlogsFromCMS = merchantData.related_blogs;
          }
        } else if (merchantData.related_blogs?.data) {
          relatedBlogsFromCMS = merchantData.related_blogs.data;
        }
        
        // Transform to the format needed by client component (same format as special_offers)
        return relatedBlogsFromCMS.map((blog: any) => ({
          id: blog.id,
          title: blog.blog_title || blog.attributes?.blog_title || '',
          slug: blog.page_slug || blog.attributes?.page_slug || '',
          type: 'blog', // Mark as blog
        }));
      })(),
      small_blog_section: merchantData.small_blog_section || null,
      small_blog_section_title: `精選${merchantData.merchant_name}優惠懶人包`, // Preset H2 title
    };

    // Process hotstore merchants for popular merchants section
    let hotstoreMerchants: any[] = [];
    console.log(`[MerchantPage] Fetching hotstore for market: ${marketKey} (hardcoded: tw)`);
    console.log(`[MerchantPage] Hotstore response:`, {
      hasData: !!hotstoreRes?.data,
      dataLength: hotstoreRes?.data?.length || 0,
      firstItem: hotstoreRes?.data?.[0] || null,
      rawResponse: JSON.stringify(hotstoreRes, null, 2).substring(0, 500), // Log first 500 chars for debugging
    });
    
    if (hotstoreRes?.data && hotstoreRes.data.length > 0) {
      const hotstore = hotstoreRes.data[0]; // Get first hotstore entry for this market
      console.log(`[MerchantPage] Hotstore entry:`, {
        id: hotstore.id,
        documentId: hotstore.documentId,
        hasMerchants: !!hotstore.merchants,
        merchantsType: typeof hotstore.merchants,
        merchantsIsArray: Array.isArray(hotstore.merchants),
        merchantsKeys: hotstore.merchants ? Object.keys(hotstore.merchants) : null,
      });
      
      // Extract merchants from hotstore.merchants
      let merchantsFromCMS = [];
      if (Array.isArray(hotstore?.merchants)) {
        if (hotstore.merchants[0]?.data) {
          merchantsFromCMS = hotstore.merchants.map((item: any) => item.data || item);
        } else {
          merchantsFromCMS = hotstore.merchants;
        }
      } else if (hotstore?.merchants?.data) {
        merchantsFromCMS = Array.isArray(hotstore.merchants.data) ? hotstore.merchants.data : [hotstore.merchants.data];
      } else if (hotstore?.merchants) {
        // Handle case where merchants is a single object
        merchantsFromCMS = [hotstore.merchants];
      }

      console.log(`[MerchantPage] Extracted merchants from hotstore:`, {
        merchantsCount: merchantsFromCMS.length,
        merchants: merchantsFromCMS.map((m: any) => ({ 
          id: m.id, 
          documentId: m.documentId,
          name: m.merchant_name || m.name,
          slug: m.page_slug,
          hasLogo: !!m.logo,
        })),
      });

      hotstoreMerchants = merchantsFromCMS
        .filter((merchant: any) => merchant && (merchant.id || merchant.documentId)) // Filter out invalid merchants
        .map((merchant: any) => ({
          id: (merchant.id || merchant.documentId || '').toString(),
          name: merchant.merchant_name || merchant.name || '',
          slug: merchant.page_slug || '',
          logoUrl: merchant.logo?.url ? rewriteImageUrl(absolutizeMedia(merchant.logo.url), siteUrl) : null,
        }));
      
      console.log(`[MerchantPage] Final hotstoreMerchants:`, {
        count: hotstoreMerchants.length,
        merchants: hotstoreMerchants,
      });
    } else {
      console.warn(`[MerchantPage] No hotstore data found for market: ${marketKey}. Check CMS for hotstore entry with market='tw'`);
      console.warn(`[MerchantPage] Full hotstoreRes:`, JSON.stringify(hotstoreRes, null, 2).substring(0, 1000));
    }

    // Transform coupons data
    const transformedCoupons = allCoupons.map((coupon: any) => {
      // Rewrite merchant logo to custom /upload domain for all coupon cards & modal
      const merchantLogoUrl = coupon.merchant?.logo?.url
        ? rewriteImageUrl(absolutizeMedia(coupon.merchant.logo.url), siteUrl)
        : "";

      return {
        id: (coupon.id?.toString() || coupon.documentId?.toString() || '').toString(),
        coupon_title: coupon.coupon_title,
        coupon_type: coupon.coupon_type,
        coupon_status: coupon.coupon_status || 'active',
        priority: coupon.priority || 0, // Include priority for sorting
        value: coupon.value,
        code: coupon.code,
        expires_at: coupon.expires_at,
        user_count: coupon.user_count || 0,
        display_count: coupon.display_count || 0, // Add display_count for usage tracking
        description: coupon.description || "",
        editor_tips: coupon.editor_tips,
        affiliate_link: coupon.affiliate_link,
        merchant: {
          id: coupon.merchant?.id || coupon.merchant,
          name: coupon.merchant?.merchant_name || coupon.merchant?.name || "",
          slug: coupon.merchant?.page_slug || "",
          logo: merchantLogoUrl,
        },
        market: {
          key: coupon.market?.key || marketKey.toUpperCase(),
        },
      };
    });

    // Separate active and expired coupons on server, then sort by priority within each group
    // Note: CMS middleware automatically changes coupon_status to 'expired' after 3 days
    const activeCoupons = transformedCoupons
      .filter((coupon: any) => coupon.coupon_status === 'active')
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
    
    const expiredCoupons = transformedCoupons
      .filter((coupon: any) => coupon.coupon_status === 'expired')
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

    // Build JSON-LD blocks using @graph structure (matching HK site format)
    // Ensure page_slug is available - use id param as fallback if page_slug is missing
    const merchantSlug = merchant.slug || id;
    const merchantUrl = `${siteUrl}/shop/${merchantSlug}`;
    const merchantId = `${merchantUrl}#merchant`;
    const breadcrumbId = `${merchantUrl}#breadcrumb`;
    
    // Use rewritten logo for schema (already rewritten above)
    const schemaLogo = merchant.logo || undefined;
    
    // Note: WebSite and Site Organization schemas are already in layout.tsx (global)
    // Do NOT duplicate them here - only generate page-specific schemas
    // Reference site Organization by @id: ${siteUrl}#organization
    const siteOrgId = `${siteUrl}#organization`;
    
    // Use site_url from merchant collection (real merchant URL, not affiliate link)
    // Normalize URL to ensure it has https:// protocol
    const normalizeUrl = (url: string | undefined): string => {
      if (!url) return merchantUrl;
      // If URL doesn't start with http:// or https://, add https://
      if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
      }
      return url;
    };
    
    const merchantSiteUrl = normalizeUrl(merchant.site_url);
    
    // Create single merchant Organization schema (ensure no duplicates)
    const merchantOrg = organizationJsonLd({
      name: merchant.name,
      url: merchantSiteUrl, // Normalized URL with https:// protocol
      logo: schemaLogo,
      // Removed sameAs - was pointing to HK URLs which is semantically wrong for TW merchants
      id: merchantId, // Use #merchant for proper referencing (single source of truth)
    });
    
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '商家', url: `${siteUrl}/shop` },
      { name: merchant.name, url: merchantUrl },
    ], merchantUrl);
    
    // Use coupon data already fetched (activeCoupons already has description from transformedCoupons)
    const offersList = offersItemListJsonLd(
      activeCoupons.map((c: any, index: number) => ({
        value: c.value,
        title: c.coupon_title, // Use coupon_title as name (from top, already sorted)
        code: c.code,
        status: c.coupon_status,
        expires_at: c.expires_at,
        url: `${merchantUrl}#coupon-active-${index + 1}`,
        description: c.description || undefined, // Use description from coupon card (already in activeCoupons)
      })),
      merchantUrl
    );
    
    const faq = faqPageJsonLd(
      (merchant.faqs || []).map((f: any) => ({ 
        question: f?.q || f?.question || '', 
        answer: f?.a || f?.answer || '' 
      })).filter((x: any) => x.question && x.answer),
      `${merchantUrl}#faq` // Use #faq suffix to match HK format
    );
    
    // Generate HowTo schema from parsed how_to data
    const howTo = merchant.how_to && merchant.how_to.length > 0
      ? howToJsonLd({
          name: `如何於${merchant.name}使用優惠碼`,
          url: merchantUrl,
          steps: merchant.how_to.map((item: any) => ({
            step: item.step || item.title || '',
            descriptions: item.descriptions || [],
          })),
          description: `了解如何在${merchant.name}使用優惠碼，享受購物折扣。`,
          image: schemaLogo,
        })
      : undefined;
    
    const pageImage = schemaLogo;
    const webPage = webPageJsonLd({
      name: merchant.name,
      url: merchantUrl,
      description: merchant.seoDescription || merchant.description || undefined,
      image: pageImage || undefined,
      dateModified: updatedTimeISO, // Use daily updated time (midnight 12-1am) to match all updated time references
      datePublished: merchant.createdAt,
      locale: marketLocale,
      siteId: `${siteUrl}#website`,
      breadcrumbId: breadcrumbId,
      merchantId: merchantId, // Use #merchant for proper referencing in about field
      publisherId: siteOrgId, // Publisher points to site Organization (Dealy)
    });
    
    // Generate rating count (matches UI display)
    const ratingCount = generateRatingCount(merchant.name);
    
    // Store schema (separate script tag, not in @graph - matching HK format)
    // Use @id to prevent duplicates
    // Hardcode market to 'tw' for TW frontend
    const storeId = `${merchantUrl}#store`;
    const store = storeJsonLd({
      name: merchant.name,
      url: merchantUrl,
      image: pageImage || undefined,
      ratingValue: "5",
      reviewCount: ratingCount.toString(),
      market: 'tw', // Hardcoded for TW frontend
      id: storeId, // Add @id to prevent duplicate detection
    });
    
    // Combine schemas into @graph array (matching HK format exactly)
    // Note: Store and BreadcrumbList are separate script tags, not in @graph
    // Note: WebSite and Site Organization schemas are in layout.tsx (global), don't duplicate here
    const graphItems: any[] = [
      merchantOrg, // Merchant-specific Organization
      webPage, // Page-specific schema (references siteOrg by @id)
    ];
    
    // Add optional schemas
    if (offersList && offersList.itemListElement?.length > 0) {
      graphItems.push(offersList);
    }
    if (faq) {
      graphItems.push(faq);
    }
    
    // Create final @graph structure
    const schemaGraph = {
      '@context': 'https://schema.org',
      '@graph': graphItems,
    };

    // Pass the data to the original client component
  return (
      <>
      <Merchant 
        merchant={merchant as any}
        coupons={activeCoupons}
        expiredCoupons={expiredCoupons}
        relatedMerchants={relatedMerchants}
        hotstoreMerchants={hotstoreMerchants}
        market={marketKey}
        specialOffers={merchant.special_offers || []}
        relatedBlogs={merchant.related_blogs || []}
        alternateUrl={alternateUrl || null}
        smallBlogSection={merchant.small_blog_section || null}
        smallBlogSectionTitle={merchant.small_blog_section_title || null}
      />
      {/* JSON-LD scripts - Matching HK site format exactly */}
      {/* eslint-disable @next/next/no-sync-scripts */}
      {/* Script 1: BreadcrumbList - separate script tag (matching HK format) */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb, null, 0) }}
      />
      {/* Script 2: Store - separate script tag (matching HK format) */}
      {store && (
        <script 
          key="store-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(store, null, 0) }}
        />
      )}
      {/* Script 3: @graph structure - Organization, FAQPage, ItemList, WebSite, WebPage */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph, null, 0) }}
      />
      {/* Script 4: HowTo - separate script tag (matching reference format) */}
      {howTo && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo, null, 0) }}
        />
      )}
      </>
    );
  } catch (error) {
    console.error('Error fetching merchant data:', error);
    notFound();
  }
}