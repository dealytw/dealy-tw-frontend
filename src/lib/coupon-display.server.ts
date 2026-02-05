/**
 * Server-side coupon display transform for DealyCouponCard.
 * Deterministic, no browser APIs - safe for SSR and hydration consistency.
 */

export function extractTextFromRichText(richText: unknown): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((item: any) => {
        if (item.children && Array.isArray(item.children)) {
          return item.children.map((child: any) => child.text || "").join("");
        }
        return item.text || "";
      })
      .join(" ");
  }
  return "";
}

export function renderRichText(richText: unknown): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText
      .map((item: any) => {
        if (item.type === "paragraph") {
          let paragraphContent = "";
          if (item.children && Array.isArray(item.children)) {
            paragraphContent = item.children
              .map((child: any) => {
                if (child.bold) return `<strong>${child.text || ""}</strong>`;
                if (child.italic) return `<em>${child.text || ""}</em>`;
                return child.text || "";
              })
              .join("");
          } else {
            paragraphContent = item.text || "";
          }
          return `<p>${paragraphContent}</p>`;
        }
        if (item.type === "list") {
          const listItems =
            item.children?.map((child: any) => {
              if (child.children && Array.isArray(child.children)) {
                return child.children
                  .map((grandChild: any) => grandChild.text || "")
                  .join("");
              }
              return child.text || "";
            })?.join("</li><li>") || "";
          return `<ul><li>${listItems}</li></ul>`;
        }
        return item.text || "";
      })
      .join("");
  }
  return "";
}

const CURRENCY_PATTERN =
  /(\d+)\s*(?:TWD|HKD|USD|EUR|JPY|CNY|SGD|MYR|THB|PHP|IDR|VND|KRW|INR|AUD|CAD|GBP|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RUB|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|ZAR|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|NGN|KES|UGX|TZS|ZMW|BWP|MWK|MZN|AOA|XOF|XAF|XPF|MUR|SCR|KMF|DJF|ERN|ETB|SOS|SLL|GMD|GNF|LRD|CDF|RWF|BIF|CVE|STN|SZL|LSL|NAD|BND|FJD|PGK|SBD|TOP|VUV|WST|TVD|KID|NPR|BTN|MVR|AFN|PKR|LKR|BDT|MMK|LAK|KHR|MOP)?\s*\$?\s*(%|折|off|減|扣|折|優惠)/i;

export type CouponDisplay = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountValue: string;
  expiry: string;
  usageCount: number;
  steps: string;
  terms: string;
  affiliateLink: string;
  coupon_type?: string;
  merchant: { name: string; logo: string };
};

export function transformCouponToDisplay(coupon: {
  id: string;
  coupon_title?: string;
  value?: string;
  code?: string;
  expires_at?: unknown;
  expires_at_formatted?: string;
  display_count?: number;
  user_count?: number;
  description?: unknown;
  editor_tips?: unknown;
  affiliate_link?: string;
  coupon_type?: string;
  merchant?: { name?: string; logo?: string };
}): CouponDisplay | null {
  if (!coupon?.merchant) return null;

  const value = coupon.value || "";
  const discountValue = value ? value.replace(CURRENCY_PATTERN, "$1") : "0";

  return {
    id: coupon.id,
    code: coupon.code || "",
    title: coupon.coupon_title || "Untitled Coupon",
    description: extractTextFromRichText(coupon.description),
    discount: value,
    discountValue,
    expiry: coupon.expires_at_formatted || "長期有效",
    usageCount: coupon.display_count ?? coupon.user_count ?? 0,
    steps: renderRichText(coupon.description),
    terms: renderRichText(coupon.editor_tips),
    affiliateLink: coupon.affiliate_link || "#",
    coupon_type: coupon.coupon_type,
    merchant: {
      name: coupon.merchant.name || "",
      logo: coupon.merchant.logo || "",
    },
  };
}
