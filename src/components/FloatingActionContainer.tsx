import { getFloatingButtons } from "@/lib/floating-buttons";
import FloatingActionButtons from "./FloatingActionButtons";
import { rewriteImageUrl } from "@/lib/strapi.server";

export default async function FloatingActionContainer() {
  // Fetch floating buttons server-side with ISR - filter by market (TW only)
  const market = 'tw'; // Hardcoded for TW frontend
  const { data: buttons } = await getFloatingButtons(market);
  
  // Don't render if no buttons for this market
  if (!buttons || buttons.length === 0) {
    return null;
  }

  // Process button icon URLs to use rewrite rule (dealy.tw/upload/...)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';
  const processedButtons = buttons.map(button => ({
    ...button,
    icon: button.icon ? {
      ...button.icon,
      url: rewriteImageUrl(button.icon.url, siteUrl)
    } : null
  }));

  return <FloatingActionButtons buttons={processedButtons} />;
}

