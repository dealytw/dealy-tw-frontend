/**
 * SEO Generation Helper Functions
 * Recreates WordPress meta generation logic for merchant pages
 */

export interface CouponForSEO {
  id: string;
  coupon_title: string;
  value: string;
  expires_at?: string | null;
}

/**
 * Extract discount value from coupon value string
 * Priority: 買X送Y > percentage > Chinese discount > cash
 */
function extractCouponValue(value: string): { type: string; value: number; label: string } | null {
  if (!value) return null;

  // Pattern 1: 買\d+送\d+ (buy X get Y)
  const buyXGetYMatch = value.match(/買(\d+)送(\d+)/);
  if (buyXGetYMatch) {
    return { 
      type: 'buy_get', 
      value: 999, // Highest priority
      label: `買${buyXGetYMatch[1]}送${buyXGetYMatch[2]}`
    };
  }

  // Pattern 2: Percentage (e.g., 50% OFF)
  const percentMatch = value.match(/(\d+)\s*%/);
  if (percentMatch) {
    const val = parseInt(percentMatch[1]);
    return { type: 'percent', value: val, label: `${val}%OFF` };
  }

  // Pattern 3: Chinese discount (e.g., 9折)
  const chineseMatch = value.match(/(\d+)折/);
  if (chineseMatch) {
    const val = parseInt(chineseMatch[1]);
    return { type: 'chinese', value: 100 - val * 10, label: `${val}折` };
  }

  // Pattern 4: Cash discount (e.g., $100 OFF)
  const cashMatch = value.matchAll(/\$?(\d{2,5})\s*(元|港幣|HK\$|\$)?/g);
  for (const match of cashMatch) {
    const val = parseInt(match[1]);
    if (val >= 20) {
      return { type: 'cash', value: val, label: `$${val} OFF` };
    }
  }

  return null;
}

/**
 * Check if coupon title contains specific keywords
 */
function extractKeywords(title: string): { newUser: boolean; freeShipping: boolean } {
  const cleanTitle = title.replace(/\s+/g, '');
  
  const newUserKeywords = /新會員|首購|首單|新客|新用戶/;
  const freeShippingKeywords = /免運/;
  
  return {
    newUser: newUserKeywords.test(cleanTitle),
    freeShipping: freeShippingKeywords.test(cleanTitle)
  };
}

/**
 * Get first coupon highlights (WordPress logic)
 * Returns: "最抵 $800 OFF & 新客優惠 & 免運費"
 * Logic:
 * 1. Get priority 1 coupon value
 * 2. Check if there's "新客優惠" keyword
 * 3. If no "新客優惠", get priority 2 coupon value (format: $X OFF or 半價)
 * 4. Check for "免運" in active coupon list
 */
export function getFirstCouponHighlights(
  coupons: CouponForSEO[],
  merchantName: string
): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const validCoupons = coupons.filter(c => {
    if (!c.expires_at) return true;
    return c.expires_at >= today;
  });

  if (validCoupons.length === 0) return '';

  const parts: string[] = [];

  // Step 1: Get priority 1 coupon value (first coupon)
  const priority1Coupon = validCoupons[0];
  let priority1Value = '';
  
  if (priority1Coupon) {
    const extracted = extractCouponValue(priority1Coupon.value);
    if (extracted) {
      priority1Value = extracted.label;
      parts.push(`最抵 ${priority1Value}`);
    }
  }

  // Step 2: Check if there's "新客優惠" keyword in ANY active coupon
  let hasNewUserDiscount = false;
  for (const coupon of validCoupons) {
    const keywords = extractKeywords(coupon.coupon_title);
    if (keywords.newUser) {
      hasNewUserDiscount = true;
      break;
    }
  }

  if (hasNewUserDiscount) {
    parts.push('新客優惠');
  } else {
    // Step 3: If no "新客優惠", get priority 2 coupon value
    if (validCoupons.length >= 2) {
      const priority2Coupon = validCoupons[1];
      const extracted = extractCouponValue(priority2Coupon.value);
      if (extracted && extracted.label !== priority1Value) {
        // Format based on type
        let formattedValue = extracted.label;
        if (extracted.type === 'cash') {
          formattedValue = `$${extracted.value} OFF`;
        }
        // else keep as is (e.g., 半價, 買一送一)
        parts.push(formattedValue);
      }
    }
  }

  // Step 4: Check for "免運" in active coupon list
  let hasFreeShipping = false;
  for (const coupon of validCoupons) {
    const keywords = extractKeywords(coupon.coupon_title);
    if (keywords.freeShipping) {
      hasFreeShipping = true;
      break;
    }
  }

  if (hasFreeShipping) {
    parts.push('免運費');
  }

  return parts.join(' & ');
}

/**
 * Get first valid coupon for description
 */
export function getFirstValidCoupon(
  coupons: CouponForSEO[]
): CouponForSEO | null {
  const today = new Date().toISOString().split('T')[0];
  
  for (const coupon of coupons) {
    if (coupon.expires_at && coupon.expires_at < today) continue;
    return coupon;
  }
  
  return null;
}

/**
 * Generate meta title (WordPress format)
 * Format: {Merchant}優惠碼及折扣｜最抵 $800 OFF & 新客優惠 & 免運費 | 10月 2025
 * If highlights empty: {Merchant}優惠碼及折扣｜{Month}月 {Year}最新優惠
 * SEO Limit: 60 characters (for better Google display)
 */
export function generateMerchantMetaTitle(
  merchantName: string,
  highlights: string
): string {
  const month = new Date().getMonth() + 1; // 1-12
  const year = new Date().getFullYear();

  if (highlights) {
    const title = `${merchantName}優惠碼及折扣｜${highlights} | ${month}月 ${year}`;
    // Truncate to ~60 chars for SEO
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  } else {
    return `${merchantName}優惠碼及折扣｜${month}月 ${year}最新優惠`;
  }
}

/**
 * Generate meta description
 * Format: 【{Merchant}優惠碼】今日精選優惠：{First Coupon} ＋{Highlight}。優惠碼即將到期，立即領取！（{Date}更新）
 * SEO Limit: 160 characters (Google display limit)
 */
export function generateMerchantMetaDescription(
  merchantName: string,
  firstCouponTitle: string,
  highlight: string
): string {
  // Format date in Chinese: 2024年10月12日
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const formattedDate = `${year}年${month}月${day}日`;

  // Truncate first coupon title if too long (max 30 chars)
  const truncatedTitle = firstCouponTitle.length > 30 
    ? firstCouponTitle.substring(0, 30) + '...'
    : firstCouponTitle;

  let description = `【${merchantName}優惠碼】今日精選優惠：${truncatedTitle}`;
  
  if (highlight) {
    description += ` ＋${highlight}`;
  }
  
  description += `。優惠碼即將到期，立即領取！（${formattedDate}更新）`;
  
  // Truncate to 160 chars for SEO
  return description.length > 160 
    ? description.substring(0, 160) + '...'
    : description;
}

