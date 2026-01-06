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

// Get Taiwan time (UTC+8)
function getTaiwanDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
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
function extractKeywords(title: string): { newUser: boolean; freeShipping: boolean; memberDiscount: boolean } {
  const cleanTitle = title.replace(/\s+/g, '');
  
  const newUserKeywords = /新會員|首購|首單|新客|新用戶/;
  const freeShippingKeywords = /免運/;
  const memberDiscountKeywords = /會員優惠|會員折扣/;
  
  return {
    newUser: newUserKeywords.test(cleanTitle),
    freeShipping: freeShippingKeywords.test(cleanTitle),
    memberDiscount: memberDiscountKeywords.test(cleanTitle)
  };
}

/**
 * Compare two coupon values to determine which is better (higher value)
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareCouponValues(
  a: { type: string; value: number; label: string },
  b: { type: string; value: number; label: string }
): number {
  // Priority order: buy_get > percent > chinese > cash
  const typePriority: Record<string, number> = {
    'buy_get': 4,
    'percent': 3,
    'chinese': 2,
    'cash': 1
  };

  const aPriority = typePriority[a.type] || 0;
  const bPriority = typePriority[b.type] || 0;

  if (aPriority !== bPriority) {
    return bPriority - aPriority; // Higher priority first
  }

  // Same type, compare by value (higher is better)
  return b.value - a.value;
}

/**
 * Get first coupon highlights (Updated logic)
 * Returns: Maximum 3 sections: "最省 4折 & 新客優惠 & 免運費"
 * Logic:
 * 1. Must have: 最省 {第一個優惠券值}
 * 2. Then add up to 2 more from (following priority order):
 *    - 新客優惠 (priority 2)
 *    - 免運費 (priority 3)
 *    - 最高優惠券值 (priority 4)
 *    - 會員優惠 (priority 5)
 */
export function getFirstCouponHighlights(
  coupons: CouponForSEO[],
  merchantName: string
): string {
  // Use Taiwan timezone for date comparisons
  const twDate = getTaiwanDate();
  const today = twDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const validCoupons = coupons.filter(c => {
    if (!c.expires_at) return true;
    return c.expires_at >= today;
  });

  if (validCoupons.length === 0) return '';

  const parts: string[] = [];

  // Step 1: Get first coupon value (MUST HAVE)
  const firstCoupon = validCoupons[0];
  let firstValue: { type: string; value: number; label: string } | null = null;
  let firstValueLabel = '';
  
  if (firstCoupon) {
    console.log(`[SEO] First coupon: ${firstCoupon.coupon_title}, value: ${firstCoupon.value}`);
    firstValue = extractCouponValue(firstCoupon.value);
    if (firstValue) {
      firstValueLabel = firstValue.label;
      parts.push(`最省 ${firstValueLabel}`);
      console.log(`[SEO] First value: ${firstValueLabel}`);
    } else {
      // If no value found, return empty (must have first value)
      return '';
    }
  } else {
    return '';
  }

  // Step 2: Collect all available options with their priorities
  const options: Array<{ text: string; priority: number }> = [];

  // Check for 新客優惠 (priority 2)
  let hasNewUserDiscount = false;
  // Check for 免運費 (priority 3)
  let hasFreeShipping = false;
  // Check for 會員優惠 (priority 5)
  let hasMemberDiscount = false;
  
  for (const coupon of validCoupons) {
    const keywords = extractKeywords(coupon.coupon_title);
    if (keywords.newUser) {
      hasNewUserDiscount = true;
      console.log(`[SEO] Found 新客優惠 in: ${coupon.coupon_title}`);
    }
    if (keywords.freeShipping) {
      hasFreeShipping = true;
      console.log(`[SEO] Found 免運費 in: ${coupon.coupon_title}`);
    }
    if (keywords.memberDiscount) {
      hasMemberDiscount = true;
      console.log(`[SEO] Found 會員優惠 in: ${coupon.coupon_title}`);
    }
  }

  // Add options with priorities
  if (hasNewUserDiscount) {
    options.push({ text: '新客優惠', priority: 2 });
  }
  if (hasFreeShipping) {
    options.push({ text: '免運費', priority: 3 });
  }
  if (hasMemberDiscount) {
    options.push({ text: '會員優惠', priority: 5 });
  }

  // Find highest coupon value (priority 4) other than the first coupon and no repeat
  if (validCoupons.length > 1) {
    let highestValue: { type: string; value: number; label: string } | null = null;
    
    for (let i = 1; i < validCoupons.length; i++) {
      const coupon = validCoupons[i];
      const extracted = extractCouponValue(coupon.value);
      
      if (extracted && extracted.label !== firstValueLabel) {
        // Compare with current highest
        if (!highestValue || compareCouponValues(extracted, highestValue) > 0) {
          highestValue = extracted;
        }
      }
    }
    
    if (highestValue) {
      options.push({ text: highestValue.label, priority: 4 });
      console.log(`[SEO] Highest value (excluding first): ${highestValue.label}`);
    }
  }

  // Step 3: Sort by priority (lower number = higher priority) and take first 2
  options.sort((a, b) => a.priority - b.priority);
  const selectedOptions = options.slice(0, 2); // Take maximum 2 more (total 3 with first value)

  // Add selected options to parts
  for (const option of selectedOptions) {
    parts.push(option.text);
  }

  const result = parts.join(' & ');
  console.log(`[SEO] Final highlights (max 3 sections): ${result}`);
  return result;
}

/**
 * Get first valid coupon for description
 */
export function getFirstValidCoupon(
  coupons: CouponForSEO[]
): CouponForSEO | null {
  // Use Taiwan timezone for date comparisons
  const twDate = getTaiwanDate();
  const today = twDate.toISOString().split('T')[0];
  
  for (const coupon of coupons) {
    if (coupon.expires_at && coupon.expires_at < today) continue;
    return coupon;
  }
  
  return null;
}

/**
 * Generate meta title
 * Format: {Merchant}折扣碼及優惠{year}｜{month}月最新折扣與信用卡優惠 | Dealy
 */
export function generateMerchantMetaTitle(
  merchantName: string,
  highlights: string // Kept for backward compatibility, but not used
): string {
  const twDate = getTaiwanDate();
  const month = twDate.getMonth() + 1; // 1-12
  const year = twDate.getFullYear();

  return `${merchantName}折扣碼及優惠${year}｜${month}月最新折扣與信用卡優惠 | Dealy`;
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
  // Format date in Chinese: 2024年10月12日 (Taiwan timezone)
  const twDate = getTaiwanDate();
  const year = twDate.getFullYear();
  const month = twDate.getMonth() + 1;
  const day = twDate.getDate();
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

