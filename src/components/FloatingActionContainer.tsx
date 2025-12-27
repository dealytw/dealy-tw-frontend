import { getFloatingButtons } from "@/lib/floating-buttons";
import FloatingActionButtons from "./FloatingActionButtons";

export default async function FloatingActionContainer() {
  // Fetch floating buttons server-side with ISR - filter by market
  const market = (process.env.NEXT_PUBLIC_MARKET_KEY || 'tw').toLowerCase();
  const { data: buttons } = await getFloatingButtons(market);
  
  // Additional client-side filter: ensure all buttons have the correct market
  // This handles cases where buttons might not have market set or have wrong market
  const filteredButtons = buttons?.filter(button => {
    const buttonMarket = button.market?.key?.toLowerCase();
    return buttonMarket === market;
  }) || [];
  
  // Don't render if no buttons for this market
  if (!filteredButtons || filteredButtons.length === 0) {
    return null;
  }

  return <FloatingActionButtons buttons={filteredButtons} />;
}

