import { getFloatingButtons } from "@/lib/floating-buttons";
import FloatingActionButtons from "./FloatingActionButtons";

export default async function FloatingActionContainer() {
  // Fetch floating buttons server-side with ISR - filter by market
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  const { data: buttons } = await getFloatingButtons(market);
  
  // Don't render if no buttons for this market
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return <FloatingActionButtons buttons={buttons} />;
}

