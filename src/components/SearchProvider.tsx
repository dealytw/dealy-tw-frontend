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
    // Prefetch all merchants on mount
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

    prefetchMerchants();
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

