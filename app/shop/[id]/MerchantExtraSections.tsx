import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import ContactFormClient from "./ContactFormClient";
import RelatedMerchantCouponCard from "@/components/RelatedMerchantCouponCard";

function blocksToHTML(blocks: any): string {
  if (!blocks) return "";
  if (!Array.isArray(blocks)) return "";

  const processChildren = (children: any[]): string => {
    if (!children || !Array.isArray(children)) return "";
    return children
      .map((child: any) => {
        if (child.type === "text" || child.text !== undefined) {
          let text = child.text || "";
          if (child.bold) text = `<strong>${text}</strong>`;
          if (child.italic) text = `<em>${text}</em>`;
          if (child.code) text = `<code>${text}</code>`;
          if (child.strikethrough) text = `<s>${text}</s>`;
          if (child.underline) text = `<u>${text}</u>`;
          return text;
        }
        if (child.type === "link") {
          const linkText = processChildren(child.children || []);
          return `<a href="${child.url || "#"}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        }
        if (child.children) return processChildren(child.children);
        return "";
      })
      .join("");
  };

  return blocks
    .map((block: any) => {
      if (block.type === "paragraph") {
        const content = processChildren(block.children || []);
        if (!content || content.trim() === "") return "<br>";
        return `<p style="margin: 0; margin-bottom: 0.5em;">${content}</p>`;
      }
      if (block.type === "heading") {
        const level = block.level || 2;
        const content = processChildren(block.children || []);
        if (level === 3) {
          return `<h3 style="font-size: 1rem; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; color: #374151;">${content}</h3>`;
        }
        return `<h${level}>${content}</h${level}>`;
      }
      if (block.type === "list") {
        const isOrdered = block.format === "ordered";
        const items = (block.children || [])
          .map((item: any) => `<li>${processChildren(item.children || [])}</li>`)
          .join("");
        return isOrdered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      }
      if (block.type === "image" && block.image) {
        let imageData = block.image;
        if (imageData?.data) imageData = imageData.data;
        const imageUrl = imageData?.attributes?.url || imageData?.url || "";
        const altText = imageData?.attributes?.alternativeText || imageData?.alternativeText || "";
        if (imageUrl) {
          const escapedAlt = String(altText).replace(/"/g, "&quot;");
          return `<img src="${imageUrl}" alt="${escapedAlt}" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1em 0;" />`;
        }
      }
      return "";
    })
    .join("\n");
}

export default function MerchantExtraSections(props: {
  merchant: any;
  relatedMerchants?: Array<{ id: string; name: string; slug: string; logo: string | null; firstCoupon: any | null }>;
  relatedBlogs?: Array<{ id: number; title: string; slug: string }>;
  specialOffers?: Array<{ id: number; title: string; slug: string }>;
  smallBlogSection?: any;
  smallBlogSectionTitle?: string | null;
}) {
  const { merchant, relatedMerchants = [], relatedBlogs = [], specialOffers = [], smallBlogSection, smallBlogSectionTitle } = props;

  return (
    <div className="space-y-8">
      {/* Related Merchants Section */}
      <section
        id="related-store-coupons"
        aria-labelledby={`${merchant.slug}-related-heading`}
        className="mb-10"
      >
        <h2 id={`${merchant.slug}-related-heading`} className="text-lg md:text-xl font-bold mb-4">
          同類商戶折扣優惠
        </h2>
        <Card id="related-merchants-section" className="shadow-md">
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedMerchants && relatedMerchants.length > 0 ? (
              relatedMerchants.map((relatedMerchant) => (
                <RelatedMerchantCouponCard key={relatedMerchant.id} relatedMerchant={relatedMerchant} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">暫無同類商戶折扣優惠</div>
            )}
          </CardContent>
        </Card>
      </section>
      {/* FAQ Section */}
      <Card className="shadow-md">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            常見問題
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(merchant?.faqs) && merchant.faqs.length > 0 ? (
            merchant.faqs
              .map((faq: any, index: number) => {
                const question = faq?.question || faq?.q || "";
                const answer = faq?.answer || faq?.a || "";
                if (!question || !answer) return null;
                return (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <h3 className="font-medium text-pink-600 mb-2">{question}</h3>
                    <div className="text-sm text-gray-600 ml-6 faq-answer-content" dangerouslySetInnerHTML={{ __html: answer }} />
                  </div>
                );
              })
              .filter(Boolean)
          ) : (
            <div className="text-center text-gray-500 py-8">暫無常見問題</div>
          )}
        </CardContent>
      </Card>

      {/* Related Shopping Categories and Guides */}
      <Card className="shadow-md">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-800">相關購物分類及攻略</h2>
        </CardHeader>
        <CardContent>
          {(() => {
            const allItems = [
              ...relatedBlogs.map((blog) => ({ ...blog, type: "blog" as const })),
              ...specialOffers.map((offer) => ({ ...offer, type: "special_offer" as const })),
            ];

            if (allItems.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  <p>暫無相關購物攻略</p>
                </div>
              );
            }

            return (
              <div className="flex flex-wrap gap-2">
                {allItems.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === "blog" ? `/blog/${item.slug}` : `/special-offers/${item.slug}`}
                  >
                    <Badge variant="outline" className="cursor-pointer px-3 py-1 text-sm border-gray-300 hover:bg-gray-50 transition-colors">
                      {item.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* How to Use Coupons Guide */}
      <Card className="shadow-md">
        <CardHeader>
          <h2 className="text-xl font-bold text-pink-600 flex items-center gap-2">如何於{merchant?.name}使用優惠碼</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.isArray(merchant?.how_to_image) && merchant.how_to_image.length > 0 && (
            <div className="mb-4">
              {merchant.how_to_image.map((imageUrl: string, imgIndex: number) => (
                <img
                  key={imgIndex}
                  src={imageUrl}
                  alt={`如何於${merchant?.name}使用優惠碼 - 步驟 ${imgIndex + 1}`}
                  className="w-full max-w-[427px] h-auto rounded-lg border border-gray-200"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}

          {Array.isArray(merchant?.how_to) && merchant.how_to.length > 0 ? (
            merchant.how_to
              .map((item: any, index: number) => {
                const step = item?.step || item?.title || "";
                const descriptions = Array.isArray(item?.descriptions) ? item.descriptions : item?.content ? [item.content] : [];
                if (!step || descriptions.length === 0) return null;
                return (
                  <div key={index} className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      {index + 1}. {step}
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                      {descriptions.map((desc: string, descIndex: number) => (
                        <li key={descIndex}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                );
              })
              .filter(Boolean)
          ) : (
            <div className="space-y-3">
              <p className="font-medium">1) 先在本頁按「顯示優惠碼」/「獲取折扣」</p>
              <p className="font-medium">2) 登入 {merchant?.name} 帳戶</p>
              <p className="font-medium">3) 選擇產品加入購物車</p>
              <p className="font-medium">4) 結帳頁輸入或套用優惠</p>
              <p className="font-medium">5) 確認折扣已生效再付款。</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Small Blog Section */}
      {smallBlogSection &&
        (typeof smallBlogSection === "string"
          ? smallBlogSection.trim() !== ""
          : Array.isArray(smallBlogSection)
            ? smallBlogSection.length > 0
            : true) && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                {smallBlogSectionTitle || `精選${merchant?.name}優惠懶人包`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: typeof smallBlogSection === "string" ? smallBlogSection : blocksToHTML(smallBlogSection),
                }}
              />
            </CardContent>
          </Card>
        )}

      {/* Contact Form */}
      <Card className="shadow-md">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-800">聯絡我們</h2>
        </CardHeader>
        <CardContent>
          <ContactFormClient merchantName={merchant?.name} />
        </CardContent>
      </Card>
    </div>
  );
}

