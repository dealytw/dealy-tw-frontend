"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAllMerchantsForSearch } from "@/lib/search-actions";

interface MerchantSearchData {
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  website: string;
}

interface SearchContextType {
  merchants: MerchantSearchData[];
  isLoading: boolean;
}

const SearchContext = createContext<SearchContextType>({
  merchants: [],
  isLoading: true,
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantSearchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Defer prefetch to not block initial page load
    // Use requestIdleCallback for low-priority background fetch
    // Falls back to setTimeout if requestIdleCallback is not available
    const prefetchMerchants = async () => {
      try {
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        const data = await getAllMerchantsForSearch(market);
        setMerchants(data);
        console.log(`✅ Prefetched ${data.length} merchants for instant search`);
      } catch (error) {
        console.error('Failed to prefetch merchants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer until browser is idle (after initial render)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(prefetchMerchants, { timeout: 2000 }); // Wait max 2s
    } else {
      // Fallback: delay by 1 second to let page render first
      setTimeout(prefetchMerchants, 1000);
    }
  }, []);

  return (
    <SearchContext.Provider value={{ merchants, isLoading }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchMerchants() {
  return useContext(SearchContext);
}

