import { getFloatingButtons } from "@/lib/floating-buttons";
import FloatingActionButtons from "./FloatingActionButtons";

export default async function FloatingActionContainer() {
  // Fetch floating buttons server-side with ISR
  const { data: buttons } = await getFloatingButtons('tw');
  
  // Don't render if no buttons
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return <FloatingActionButtons buttons={buttons} />;
}

